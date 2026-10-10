export function mensagemErro(error: unknown, fallback: string): string {
  const resposta = error as { status?: number; error?: { mensagem?: string; campos?: Record<string, string> } };
  if (resposta?.status === 0) return 'Sem conexão com o servidor. Confira sua conexão e tente novamente.';
  if (resposta?.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  if (resposta?.status === 403) return 'Você não tem permissão para realizar esta operação.';
  if (resposta?.status && resposta.status >= 500) return 'O servidor não conseguiu concluir a operação. Tente novamente.';
  const campos = Object.entries(resposta?.error?.campos ?? {}).map(([campo, detalhe]) => `${campo}: ${detalhe}`);
  return campos.length ? campos.join('; ') : resposta?.error?.mensagem || fallback;
}
