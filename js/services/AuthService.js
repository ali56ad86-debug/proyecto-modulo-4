
/* =========================================
   IMPORTAR STORAGE SERVICE
========================================= */
import {
    STORAGE_KEYS,
    storageService,
} from './StorageService.js';

/* =========================================
   SERVICIO DE AUTENTICACIÓN
========================================= */
class AuthService {

    /* =====================================
       INICIAR SESIÓN
    ===================================== */
    login(email, password) {

        // Recuperar usuarios registrados
        const usuarios =
            storageService.obtener(
                STORAGE_KEYS.USUARIOS,
                [],
            );

        // Normalizar correo
        const emailNormalizado =
            String(email)
                .trim()
                .toLowerCase();

        // Buscar usuario activo
        const usuario =
            usuarios.find(
                (u) =>
                    u.email.toLowerCase() ===
                        emailNormalizado &&
                    u.password === password &&
                    u.activo !== false,
            );

        // Validar credenciales
        if (!usuario) {
            throw new Error(
                'Correo o contraseña incorrectos.',
            );
        }

        // Crear sesión
        const sesion = {
            usuarioId: usuario.id,
            fechaInicio:
                new Date().toISOString(),
        };

        // Guardar sesión
        storageService.guardar(
            STORAGE_KEYS.SESION,
            sesion,
        );

        return usuario;
    }

    /* =====================================
       CERRAR SESIÓN
    ===================================== */
    logout() {
        storageService.eliminar(
            STORAGE_KEYS.SESION,
        );
    }

    /* =====================================
       OBTENER USUARIO ACTUAL
    ===================================== */
    getCurrentUser() {

        // Recuperar sesión
        const sesion =
            storageService.obtener(
                STORAGE_KEYS.SESION,
                null,
            );

        if (!sesion) {
            return null;
        }

        // Recuperar usuarios
        const usuarios =
            storageService.obtener(
                STORAGE_KEYS.USUARIOS,
                [],
            );

        // Buscar usuario de la sesión
        return (
            usuarios.find(
                (usuario) =>
                    usuario.id ===
                    sesion.usuarioId,
            ) || null
        );
    }

    /* =====================================
       PROTEGER RUTA
    ===================================== */
    protegerRuta() {

        const usuario =
            this.getCurrentUser();

        if (!usuario) {
            window.location.href =
                'index.html';

            return false;
        }

        return true;
    }
}

/* =========================================
   INSTANCIA AUTH SERVICE
========================================= */
export const authService =
    new AuthService();
