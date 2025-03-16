import { setupL10N, t } from "./libs/l10n"
import { getMirrorId } from "./libs/utils.ts"
import type { Block, DbId } from "./orca.d.ts"
import zhCN from "./translations/zhCN"
import { format } from "date-fns";

const { subscribe } = window.Valtio

let pluginName: string
let unsubscribe: () => void
let prevTaskTagName: string

const statusState: Map<string, string> = new Map()

export async function load(_name: string) {
  pluginName = _name

  // 初始化本地化系统
  setupL10N(orca.state.locale, { "zh-CN": zhCN })

  // 设置插件配置架构
  await orca.plugins.setSettingsSchema(pluginName, {
    taskName: {
      label: t("Task tag name"),
      description: t("The name of the tag that is used to identify tasks."),
      type: "string",
      defaultValue: "TASK",
    },
    statusName: {
      label: t("Status property name"),
      description: t(
        "The name of the property that stores the status of a task.",
      ),
      type: "string",
      defaultValue: "Status",
    },
    statusTodo: {
      label: t("Todo status value"),
      description: t(
        "The value of the status property that represents a task that is not started yet.",
      ),
      type: "string",
      defaultValue: "LATER",
    },
    statusDoing: {
      label: t("Doing status value"),
      description: t(
        "The value of the status property that represents a task that is in progress.",
      ),
      type: "string",
      defaultValue: "NOW",
    },
    statusDone: {
      label: t("Done status value"),
      description: t(
        "The value of the status property that represents a task that is completed.",
      ),
      type: "string",
      defaultValue: "DONE",
    },
    startTimeName: {
      label: t("Start time property name"),
      description: t(
        "The name of the property that stores the start time of a task.",
      ),
      type: "string",
      defaultValue: "START",
    },
    endTimeName: {
      label: t("End time property name"),
      description: t(
        "The name of the property that stores the end time of a task.",
      ),
      type: "string",
      defaultValue: "END",
    },
    scheduledTimeName: {  // 新增预约时间字段
      label: t("Scheduled time property name"),
      description: t(
        "The name of the property that stores the scheduled time of a task.",
      ),
      type: "string",
      defaultValue: "SCHEDULED",
    },
    deadlineTimeName: {  // 新增截止时间字段
      label: t("Deadline time property name"),
      description: t(
        "The name of the property that stores the deadline time of a task.",
      ),
      type: "string",
      defaultValue: "DEADLINE",
    },
  })

  // 初始化任务标签
  prevTaskTagName = orca.state.plugins[pluginName]!.settings!.taskName
  await readyTag()
  injectStyles()

  // 订阅设置变更事件
  unsubscribe = subscribe(orca.state.plugins[pluginName]!, async () => {
    if (orca.state.plugins[pluginName]!.settings) {
      await readyTag(true)
      removeStyles()
      injectStyles()
    } else {
      removeStyles()
    }
  })

  // 注册任务状态切换命令
  if (orca.state.commands[`${pluginName}.cycleTaskStatus`] == null) {
    orca.commands.registerEditorCommand(
      `${pluginName}.cycleTaskStatus`,
      async ([, , cursor], id?: DbId) => {
        if (cursor.anchor !== cursor.focus) return null

        const settings = orca.state.plugins[pluginName]!.settings!
        const blockId = getMirrorId(id ?? cursor.anchor.blockId)
        const block = orca.state.blocks[blockId]

        if (block == null) return null

        const tagRef = block.refs.find(
          (r) => r.type === 2 && r.alias === settings.taskName,
        )

        if (tagRef == null) {
          await orca.commands.invokeEditorCommand(
            "core.editor.insertTag",
            cursor,
            blockId,
            settings.taskName,
            [
              { name: settings.statusName, value: settings.statusTodo },
              { name: settings.startTimeName, value: null },
              { name: settings.endTimeName, value: null },
              { name: settings.scheduledTimeName, value: null },
              { name: settings.deadlineTimeName, value: null },
            ],
          )
        } else {
          const currStatus =
            tagRef.data?.find((d) => d.name === settings.statusName)?.value ??
            ""
          const nextStatus = statusState.get(currStatus)
          const currStartTime = tagRef.data?.find(
            (d) => d.name === settings.startTimeName,
          )?.value
          const currEndTime = tagRef.data?.find(
            (d) => d.name === settings.endTimeName,
          )?.value
          
          const currScheduled = tagRef.data?.find(
            (d) => d.name === settings.scheduledTimeName,
          )?.value
          const currDeadline = tagRef.data?.find(
            (d) => d.name === settings.deadlineTimeName,
          )?.value

          await orca.commands.invokeEditorCommand(
            "core.editor.insertTag",
            cursor,
            blockId,
            settings.taskName,
            [
              { name: settings.statusName, value: nextStatus },
              {
                name: settings.startTimeName,
                type: 5,
                value:
                  nextStatus === settings.statusDoing
                    ? new Date()
                    : currStartTime,
              },
              {
                name: settings.endTimeName,
                type: 5,
                value:
                  nextStatus === settings.statusDone ? new Date() : currEndTime,
              },
              {
                name: settings.scheduledTimeName,
                type: 5,
                value: currScheduled,
              },
              {
                name: settings.deadlineTimeName,
                type: 5,
                value: currDeadline,
              },
            ],
          )
        }

        return null
      },
      () => {},
      { label: t("Make block a task and cycle its status") },
    )
  }

  // 设置快捷键绑定
  if (orca.state.shortcuts[`${pluginName}.cycleTaskStatus`] == null) {
    orca.shortcuts.assign("alt+enter", `${pluginName}.cycleTaskStatus`)
  }

  // 绑定全局点击事件
  document.body.addEventListener("click", onClick)

  console.log(`${pluginName} loaded.`)
}

// 插件卸载逻辑
export async function unload() {
  // 清理订阅、样式、快捷键和事件监听
  unsubscribe()
  removeStyles()
  orca.shortcuts.reset(`${pluginName}.cycleTaskStatus`)
  orca.commands.unregisterEditorCommand(`${pluginName}.cycleTaskStatus`)
  document.body.removeEventListener("click", onClick)

  // 清理MutationObserver
  if (window.observer) {
    window.observer.disconnect()
    delete window.observer
  }

  console.log(`${pluginName} unloaded.`)
}

/**
 * 初始化/更新任务标签配置
 * @param isUpdate 是否为更新操作
 */
async function readyTag(isUpdate: boolean = false) {
  const settings = orca.state.plugins[pluginName]!.settings!

  // 初始化状态机映射
  statusState.clear()
  statusState.set("", settings.statusTodo)
  statusState.set(settings.statusTodo, settings.statusDoing)
  statusState.set(settings.statusDoing, settings.statusDone)
  statusState.set(settings.statusDone, "")

  // Remove old task tag
  if (settings.taskName !== prevTaskTagName) {
    const { id: oldTaskId } =
      (await orca.invokeBackend("get-blockid-by-alias", prevTaskTagName)) ?? {}
    if (oldTaskId) {
      try {
        await orca.commands.invokeEditorCommand(
          "core.editor.deleteBlocks",
          null,
          [oldTaskId],
        )
      } catch (err) {
        // ignore
      }
    }
  }

  let taskBlock = (await orca.invokeBackend(
    "get-block-by-alias",
    settings.taskName,
  )) as Block
  let taskBlockId = taskBlock?.id
  const nonExistent = taskBlock == null

  // Ensure task tag exists
  if (nonExistent) {
    await orca.commands.invokeGroup(async () => {
      taskBlockId = await orca.commands.invokeEditorCommand(
        "core.editor.insertBlock",
        null,
        null,
        null,
        [{ t: "t", v: settings.taskName }],
      )

      await orca.commands.invokeEditorCommand(
        "core.editor.createAlias",
        null,
        settings.taskName,
        taskBlockId,
      )

      prevTaskTagName = settings.taskName
    })
  }

  // 设置标签属性
  if (isUpdate || nonExistent) {
    await orca.commands.invokeEditorCommand(
      "core.editor.setProperties",
      null,
      [taskBlockId],
      [
        // 状态属性配置
        {
          name: settings.statusName,
          type: 6,  // 6 对应枚举类型
          typeArgs: {
            subType: "single",
            choices: [
              settings.statusTodo,
              settings.statusDoing,
              settings.statusDone,
            ],
          },
          pos: taskBlock?.properties?.find(
            (p) => p.name === settings.statusName
          )?.pos,
        },
        // 时间属性配置（保持原有新增注释）
        {
          name: settings.startTimeName,
          type: 5,
          typeArgs: { subType: "datetime" },
          pos: taskBlock?.properties?.find(
            (p) => p.name === settings.startTimeName,
          )?.pos,
        },
        {
          name: settings.endTimeName,
          type: 5,
          typeArgs: { subType: "datetime" },
          pos: taskBlock?.properties?.find(
            (p) => p.name === settings.endTimeName,
          )?.pos,
        },
        {  // 新增预约时间属性
          name: settings.scheduledTimeName,
          type: 5,
          typeArgs: { subType: "datetime" },
          pos: taskBlock?.properties?.find(
            (p) => p.name === settings.scheduledTimeName,
          )?.pos,
        },
        {  // 新增截止时间属性
          name: settings.deadlineTimeName,
          type: 5,
          typeArgs: { subType: "datetime" },
          pos: taskBlock?.properties?.find(
            (p) => p.name === settings.deadlineTimeName,
          )?.pos,
        },
      ]
    )
  }
}

/**
 * 动态注入任务状态样式
 */
function injectStyles() {
  const settings = orca.state.plugins[pluginName]!.settings!
  
  // 生成CSS选择器需要的规范化名称
  const taskTagName = settings.taskName.toLowerCase()
  const statusPropName = settings.statusName.replace(/ /g, "-").toLowerCase()
  
  const statusScheduledTimeName = settings.scheduledTimeName.replace(/ /g, "-").toLowerCase()
  const statusDeadlineTimeName = settings.deadlineTimeName.replace(/ /g, "-").toLowerCase()
  const statusTodoValue = settings.statusTodo
  const statusDoingValue = settings.statusDoing
  const statusDoneValue = settings.statusDone

  // 创建带状态图标的样式表
  const styles = `
    /* 基础图标样式和状态图标配置保持不变 */
    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"])::before {
      font-family: "tabler-icons";
      speak: none;
      font-style: normal;
      font-weight: normal;
      font-variant: normal;
      text-transform: none;
      -webkit-font-smoothing: antialiased;
      margin-right: var(--orca-spacing-md);
      cursor: pointer;
    }

    /* 不同状态的图标配置 */
    .orca-repr-main-content:has(...)::before {
      content: "\\ea6b";  // Tabler图标Unicode
      color: #858585;     // 图标颜色
      /* 缩放和定位样式 */
      transform: scale(1.5);
      transform-origin: 1.5rem center;
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusTodoValue}"])::before {
      content: "\\ea6b";
      color: #858585;
      width: 1.8125rem;
      display: inline-block;
      margin-right: 0;
      text-align: center;
      transform: scale(1.5);
      transform-origin: 1.5rem center;
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoingValue}"])::before {
      content: "\\fe56";
      color: #ebbc00;
      width: 1.8125rem;
      display: inline-block;
      margin-right: 0;
      text-align: center;
      transform: scale(1.5);
      transform-origin: 1.5rem center;
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"])::before {
      content: "\\f704";
      color: #5bb98c;
      width: 1.8125rem;
      display: inline-block;
      margin-right: 0;
      text-align: center;
      transform: scale(1.5);
      transform-origin: 1.5rem center;
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"]) .orca-inline {
      opacity: 0.75;
    }

    /* 基础样式应用于所有任务日期显示 */
    .orca-repr-main:has(>.orca-repr-main-content>.orca-tags>.orca-tag[data-name="${taskTagName}"])::after {
      opacity: 0.6;
      font-style: italic;
    }

    /* 为查询列表中的任务日期显示添加特定样式 */
    .orca-query-list .orca-repr-main[data-formatted-scheduled]::after,
    .orca-query-list .orca-repr-main[data-formatted-deadline]::after,
    .orca-query-list .orca-repr-main[data-formatted-dates]::after
    {
      padding-left: 1rem;
    }

    /* 只有截止时间的任务 - 修改选择器以处理null值 */
    .orca-repr-main:has(>.orca-repr-main-content>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusDeadlineTimeName}]:not([data-${statusDeadlineTimeName}="null"]):is([data-${statusScheduledTimeName}="null"], :not([data-${statusScheduledTimeName}])))::after {
      height: 1.5rem;
      content: attr(data-formatted-deadline);
    }

    /* 只有预约时间的任务 - 修改选择器以处理null值 */
    .orca-repr-main:has(>.orca-repr-main-content>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusScheduledTimeName}]:not([data-${statusScheduledTimeName}="null"]):is([data-${statusDeadlineTimeName}="null"], :not([data-${statusDeadlineTimeName}])))::after {
      height: 1.5rem;
      content: attr(data-formatted-scheduled);
    }

    /* 同时有预约时间和截止时间的任务 */
    .orca-repr-main:has(>.orca-repr-main-content>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusScheduledTimeName}][data-${statusDeadlineTimeName}]:not([data-${statusScheduledTimeName}="null"]):not([data-${statusDeadlineTimeName}="null"]))::after {
      height: 1.5rem;
      content: attr(data-formatted-dates);
    }
  `

  // 动态插入样式表
  const styleEl = document.createElement("style")
  styleEl.dataset.role = pluginName
  styleEl.innerHTML = styles
  document.head.appendChild(styleEl)

  // 添加日期格式化和动态更新功能
  updateTaskDates(taskTagName, statusScheduledTimeName, statusDeadlineTimeName)
  
  // 设置MutationObserver监听DOM变化，以便在新任务创建时更新日期显示
  const observer = new MutationObserver(() => {
    updateTaskDates(taskTagName, statusScheduledTimeName, statusDeadlineTimeName)
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-scheduled', 'data-deadline']
  })
  
  // 存储observer以便在插件卸载时清理
  window.observer = observer
}

/**
 * 更新任务日期显示
 */
function updateTaskDates(
  taskTagName: string,
  statusScheduledTimeName: string,
  statusDeadlineTimeName: string
) {
  // 格式化日期为人类可读格式
  const formatDate = (date: Date): String => {
    return format(
      date,
      "MM/dd/yyyy, EE, hh:mm"
    )
  }

  // 处理只有截止时间的任务 - 修改选择器
  const deadlineOnlyBlocks = document.querySelectorAll(
    `.orca-repr-main:has(>.orca-repr-main-content>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusDeadlineTimeName}]:not([data-${statusDeadlineTimeName}="null"]):is([data-${statusScheduledTimeName}="null"], :not([data-${statusScheduledTimeName}])))`
  )
  
  deadlineOnlyBlocks.forEach(block => {
    const tag = block.querySelector(`.orca-tag[data-name="${taskTagName}"]`)
    if (!tag) return
    
    const deadlineTimestamp = tag.getAttribute(`data-${statusDeadlineTimeName}`)
    if (!deadlineTimestamp || deadlineTimestamp === 'null') return
    
    const deadlineDate = new Date(parseInt(deadlineTimestamp))
    const formattedDeadline = formatDate(deadlineDate)
    
    block.setAttribute('data-formatted-deadline', 
      `Deadl.: ${formattedDeadline}`)
  })
  
  // 处理只有预约时间的任务 - 修改选择器
  const scheduledOnlyBlocks = document.querySelectorAll(
    `.orca-repr-main:has(>.orca-repr-main-content>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusScheduledTimeName}]:not([data-${statusScheduledTimeName}="null"]):is([data-${statusDeadlineTimeName}="null"], :not([data-${statusDeadlineTimeName}])))`
  )
  
  scheduledOnlyBlocks.forEach(block => {
    const tag = block.querySelector(`.orca-tag[data-name="${taskTagName}"]`)
    if (!tag) return
    
    const scheduledTimestamp = tag.getAttribute(`data-${statusScheduledTimeName}`)
    if (!scheduledTimestamp || scheduledTimestamp === 'null') return
    
    const scheduledDate = new Date(parseInt(scheduledTimestamp))
    const formattedScheduled = formatDate(scheduledDate)
    
    block.setAttribute('data-formatted-scheduled', 
      `Sched.: ${formattedScheduled}`)
  })
  
  // 处理同时有预约时间和截止时间的任务
  const bothTimeBlocks = document.querySelectorAll(
    `.orca-repr-main:has(>.orca-repr-main-content>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusScheduledTimeName}][data-${statusDeadlineTimeName}]:not([data-${statusScheduledTimeName}="null"]):not([data-${statusDeadlineTimeName}="null"]))`
  )
  
  bothTimeBlocks.forEach(block => {
    const tag = block.querySelector(`.orca-tag[data-name="${taskTagName}"]`)
    if (!tag) return
    
    const scheduledTimestamp = tag.getAttribute(`data-${statusScheduledTimeName}`)
    const deadlineTimestamp = tag.getAttribute(`data-${statusDeadlineTimeName}`)
    
    if (!scheduledTimestamp || !deadlineTimestamp || 
        scheduledTimestamp === 'null' || deadlineTimestamp === 'null') return
    
    const scheduledDate = new Date(parseInt(scheduledTimestamp))
    const deadlineDate = new Date(parseInt(deadlineTimestamp))
    
    const formattedScheduled = formatDate(scheduledDate)
    const formattedDeadline = formatDate(deadlineDate)
    
    block.setAttribute('data-formatted-dates', 
      `Sched.: ${formattedScheduled}      Deadl.: ${formattedDeadline}`)
  })
}

function removeStyles() {
  const styleEls = document.querySelectorAll(`style[data-role="${pluginName}"]`)
  styleEls.forEach((el) => el.remove())
}

function onClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target?.classList.contains("orca-repr-main-content")) return

  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  if (x < 0 || x > 18 || y < 0 || y > 18) return

  const settings = orca.state.plugins[pluginName]!.settings!
  const parent = target.parentElement
  if (
    parent?.querySelector(
      `.orca-tag[data-name="${settings.taskName.toLowerCase()}"]`,
    ) == null
  )
    return

  const blockId = (parent.closest(".orca-block") as HTMLElement)?.dataset.id
  if (blockId == null) return

  orca.commands.invokeEditorCommand(
    `${pluginName}.cycleTaskStatus`,
    null,
    blockId,
  )
}
