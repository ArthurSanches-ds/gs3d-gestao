// Lê campos do formulário como texto
export function readForm(formData: FormData, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

// Lê um campo que se repete (várias linhas com o mesmo nome)
export function readList(formData: FormData, field: string) {
  return formData.getAll(field).map((value) => String(value));
}
