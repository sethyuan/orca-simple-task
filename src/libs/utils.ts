export const isMacOS =
  typeof window !== "undefined" && navigator.userAgent.includes("Mac OS X")

export function getMirrorId(id: number) {
  const block = orca.state.blocks[id]
  if (block == null) return id
  const repr = block?.properties?.find((p) => p.name === "_repr")?.value
  if (repr == null) return id
  if (repr.type === "mirror") return repr.mirroredId
  return id
}
