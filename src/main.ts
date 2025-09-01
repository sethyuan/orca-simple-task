import { setupL10N, t } from "./libs/l10n"
import { getMirrorId } from "./libs/utils.ts"
import type { Block, DbId } from "./orca.d.ts"
import zhCN from "./translations/zhCN"

const { subscribe } = window.Valtio

let pluginName: string
let unsubscribe: () => void
let prevTaskTagName: string

const statusState: Map<string, string> = new Map()

export async function load(_name: string) {
  pluginName = _name

  // Your plugin code goes here.
  setupL10N(orca.state.locale, { "zh-CN": zhCN })

  await orca.plugins.setSettingsSchema(pluginName, {
    taskName: {
      label: t("Task tag name"),
      description: t("The name of the tag that is used to identify tasks."),
      type: "string",
      defaultValue: "Task",
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
      defaultValue: "TODO",
    },
    statusDoing: {
      label: t("Doing status value"),
      description: t(
        "The value of the status property that represents a task that is in progress.",
      ),
      type: "string",
      defaultValue: "Doing",
    },
    statusDone: {
      label: t("Done status value"),
      description: t(
        "The value of the status property that represents a task that is completed.",
      ),
      type: "string",
      defaultValue: "Done",
    },
    statusCanceled: {
      label: t("Canceled status value"),
      description: t(
        "The value of the status property that represents a task that is canceled.",
      ),
      type: "string",
      defaultValue: "Canceled",
    },
    startTimeName: {
      label: t("Start time property name"),
      description: t(
        "The name of the property that stores the start time of a task.",
      ),
      type: "string",
      defaultValue: "Start time",
    },
    endTimeName: {
      label: t("End time property name"),
      description: t(
        "The name of the property that stores the end time of a task.",
      ),
      type: "string",
      defaultValue: "End time",
    },
  })

  prevTaskTagName = orca.state.plugins[pluginName]!.settings!.taskName
  await readyTag()
  injectStyles()

  unsubscribe = subscribe(orca.state.plugins[pluginName]!, async () => {
    if (orca.state.plugins[pluginName]!.settings) {
      await readyTag(true)
      removeStyles()
      injectStyles()
    } else {
      removeStyles()
    }
  })

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
            ],
          )
        }

        return null
      },
      () => {},
      { label: t("Make block a task and cycle its status") },
    )
  }

  if (orca.state.shortcuts[`${pluginName}.cycleTaskStatus`] == null) {
    orca.shortcuts.assign("alt+enter", `${pluginName}.cycleTaskStatus`)
  }

  document.body.addEventListener("click", onClick)

  console.log(`${pluginName} loaded.`)
}

export async function unload() {
  // Clean up any resources used by the plugin here.
  unsubscribe()
  removeStyles()
  orca.shortcuts.reset(`${pluginName}.cycleTaskStatus`)
  orca.commands.unregisterEditorCommand(`${pluginName}.cycleTaskStatus`)
  document.body.removeEventListener("click", onClick)

  console.log(`${pluginName} unloaded.`)
}

async function readyTag(isUpdate: boolean = false) {
  const settings = orca.state.plugins[pluginName]!.settings!

  statusState.clear()
  statusState.set("", settings.statusTodo)
  statusState.set(settings.statusTodo, settings.statusDoing)
  statusState.set(settings.statusDoing, settings.statusDone)
  statusState.set(settings.statusDone, settings.statusTodo)

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

  if (isUpdate || nonExistent) {
    // Set task tag properties
    await orca.commands.invokeEditorCommand(
      "core.editor.setProperties",
      null,
      [taskBlockId],
      [
        {
          name: settings.statusName,
          type: 6,
          typeArgs: {
            subType: "single",
            choices: [
              settings.statusTodo,
              settings.statusDoing,
              settings.statusDone,
              settings.statusCanceled,
            ],
          },
          pos: taskBlock?.properties?.find(
            (p) => p.name === settings.statusName,
          )?.pos,
        },
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
      ],
    )
  }
}

function injectStyles() {
  const settings = orca.state.plugins[pluginName]!.settings!
  const taskTagName = settings.taskName.toLowerCase()
  const statusPropName = settings.statusName.replace(/ /g, "-").toLowerCase()
  const statusTodoValue = settings.statusTodo
  const statusDoingValue = settings.statusDoing
  const statusDoneValue = settings.statusDone
  const statusCanceledValue = settings.statusCanceled

  const styles = `
    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"])::before,
    .orca-repr:has(>.orca-repr-card-title>.orca-tags>.orca-tag[data-name="${taskTagName}"])>.orca-repr-main>.orca-repr-main-content::before {
      font-family: "tabler-icons";
      speak: none;
      font-style: normal;
      font-weight: normal;
      font-variant: normal;
      text-transform: none;
      -webkit-font-smoothing: antialiased;
      margin-right: var(--orca-spacing-md);
      cursor: pointer;
      font-size: calc(.25rem + var(--orca-block-line-height) / var(--orca-lineheight-md));
      display: inline-block;
      line-height: 1;
      translate: 0 .125rem;
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusTodoValue}"])::before,
    .orca-repr:has(>.orca-repr-card-title>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusTodoValue}"])>.orca-repr-main>.orca-repr-main-content::before {
      content: "\\ea6b";
      color: var(--orca-color-text-2);
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoingValue}"])::before,
    .orca-repr:has(>.orca-repr-card-title>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoingValue}"])>.orca-repr-main>.orca-repr-main-content::before {
      content: "\\fedd";
      color: var(--orca-color-text-yellow);
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"])::before,
    .orca-repr:has(>.orca-repr-card-title>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"])>.orca-repr-main>.orca-repr-main-content::before {
      content: "\\f704";
      color: var(--orca-color-text-green);
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusCanceledValue}"])::before,
    .orca-repr:has(>.orca-repr-card-title>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusCanceledValue}"])>.orca-repr-main>.orca-repr-main-content::before {
      content: "\\ff11";
      color: var(--orca-color-text-2);
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"]) .orca-inline,
    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusCanceledValue}"]) .orca-inline,
    .orca-repr:has(>.orca-repr-card-title>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"])>.orca-repr-main>.orca-repr-main-content .orca-inline,
    .orca-repr:has(>.orca-repr-card-title>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusCanceledValue}"])>.orca-repr-main>.orca-repr-main-content .orca-inline {
      opacity: 0.75;
    }
  `

  const styleEl = document.createElement("style")
  styleEl.dataset.role = pluginName
  styleEl.innerHTML = styles
  document.head.appendChild(styleEl)
}

function removeStyles() {
  const styleEls = document.querySelectorAll(`style[data-role="${pluginName}"]`)
  styleEls.forEach((el) => el.remove())
}

function onClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target?.classList.contains("orca-repr-main-content")) return

  const rect = target.getBoundingClientRect()
  const styles = window.getComputedStyle(target)
  const paddingLeft = parseFloat(styles.paddingLeft)
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const sizeX = parseFloat(styles.fontSize) + (paddingLeft || 0);
  const sizeY = parseFloat(styles.lineHeight);
  if (x < 0 || x > sizeX || y < 0 || y > sizeY) return;

  const settings = orca.state.plugins[pluginName]!.settings!
  const blockEl = target.closest(".orca-block") as HTMLElement | undefined
  if (
    blockEl?.querySelector(
      `&>.orca-repr>:not(.orca-block) .orca-tag[data-name="${settings.taskName.toLowerCase()}"]`,
    ) == null
  )
    return

  const blockId = blockEl?.dataset.id
  if (blockId == null) return

  orca.commands.invokeEditorCommand(
    `${pluginName}.cycleTaskStatus`,
    null,
    blockId,
  )
}
