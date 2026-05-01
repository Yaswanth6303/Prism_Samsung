type Provider = 'claude' | 'openai' | 'gemini'

export async function callAI(provider: Provider, prompt: string) {
  const title = `# AI Notes (${provider})`
  const body = `\n\n## Summary\n- This is a local placeholder response until your auth/db friend wires provider keys.\n- Prompt length: ${prompt.length} characters.\n\n## Key Points\n- Keep route contracts stable.\n- Replace this module with real provider calls later.`
  return `${title}${body}`
}
