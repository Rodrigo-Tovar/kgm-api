export const ROLES_USUARIO = [
  'ADMINISTRADOR',
  'DOCENTE',
  'TUTOR',
] as const;

export type RolUsuario = (typeof ROLES_USUARIO)[number];

export type UsuarioAutenticado = {
  sub: number;
  escuelaId: number;
  rol: RolUsuario;
};
