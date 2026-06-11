type CodeRow = { code: string }

function unitAbbrev(name?: string | null): string {
  if (!name) return ''
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase()
}

/** Suggest next department code: INSTITUTION-UNIT-001 (editable). */
export function suggestDepartmentCode(
  institutionCode: string | undefined,
  unitName: string | undefined,
  existing: CodeRow[],
): string {
  const inst = (institutionCode || '').trim().toUpperCase()
  const unit = unitAbbrev(unitName)
  const prefix = [inst, unit].filter(Boolean).join('-')

  const taken = new Set(existing.map((row) => row.code.trim()))
  let n = 1
  let code = prefix ? `${prefix}-${String(n).padStart(3, '0')}` : String(n).padStart(3, '0')

  while (taken.has(code)) {
    n += 1
    code = prefix ? `${prefix}-${String(n).padStart(3, '0')}` : String(n).padStart(3, '0')
  }

  return code
}
