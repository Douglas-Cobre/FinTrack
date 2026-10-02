export type UsuarioResumo = {
  id: string;
  nome: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  tipo: 'Bearer';
  expiraEm: string;
  usuario: UsuarioResumo;
};

export type LoginRequest = {
  email: string;
  senha: string;
};

export type CadastroRequest = {
  nome: string;
  email: string;
  senha: string;
};
