
/* =========================================
   IMPORTACIONES
========================================= */
import { Usuario } from './models/Usuario.js';
import { Cuenta } from './models/Cuenta.js';
import { generarNumeroCuenta } from './utils/helpers.js';
import { validarCampoObligatorio } from './utils/validators.js';

import {
    STORAGE_KEYS,
    storageService,
} from './services/StorageService.js';

import { authService } from './services/AuthService.js';

/* =========================================
   INICIALIZAR LOCALSTORAGE
========================================= */
function inicializarStorage() {
    const usuarios = storageService.obtener(
        STORAGE_KEYS.USUARIOS, null
    );

    const cuentas = storageService.obtener(
        STORAGE_KEYS.CUENTAS, null
    );

    const movimientos = storageService.obtener(
        STORAGE_KEYS.MOVIMIENTOS, null
    );

    if (usuarios === null) {
        storageService.guardar(STORAGE_KEYS.USUARIOS, []);
    }

    if (cuentas === null) {
        storageService.guardar(STORAGE_KEYS.CUENTAS, []);
    }

    if (movimientos === null) {
        storageService.guardar(STORAGE_KEYS.MOVIMIENTOS, []);
    }
}

/* =========================================
   REGISTRO DE USUARIO
========================================= */
function manejarRegistro(event) {
    event.preventDefault();

    const nombre = document.querySelector(
        '#registroNombre'
    ).value.trim();

    const email = document.querySelector(
        '#registroEmail'
    ).value.trim().toLowerCase();

    const telefono = document.querySelector(
        '#registroTelefono'
    ).value.trim();

    const password = document.querySelector(
        '#registroPassword'
    ).value;

    const confirmarPassword = document.querySelector(
        '#registroConfirmPassword'
    ).value;

    // Validar campos obligatorios
    if (
        !validarCampoObligatorio(nombre) ||
        !validarCampoObligatorio(email) ||
        !validarCampoObligatorio(password)
    ) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Completa los campos obligatorios.',
        });
        return;
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
        Swal.fire({
            icon: 'warning',
            title: 'Contraseña inválida',
            text: 'La contraseña debe tener al menos 6 caracteres.',
        });
        return;
    }

    // Comparar contraseñas
    if (password !== confirmarPassword) {
        Swal.fire({
            icon: 'warning',
            title: 'Contraseñas diferentes',
            text: 'Las contraseñas no coinciden.',
        });
        return;
    }

    // Recuperar usuarios existentes
    const usuarios = storageService.obtener(
        STORAGE_KEYS.USUARIOS, []
    );

    // Comprobar correo duplicado
    const emailExistente = usuarios.some(
        (usuario) =>
            usuario.email.toLowerCase() === email
    );

    if (emailExistente) {
        Swal.fire({
            icon: 'error',
            title: 'Correo registrado',
            text: 'Ya existe un usuario con este correo.',
        });
        return;
    }

    // Crear usuario
    const nuevoUsuario = new Usuario({
        nombre,
        email,
        telefono,
        password,
    });

    // Generar número de cuenta único
    let numeroCuenta;

    do {
        numeroCuenta = generarNumeroCuenta();
    } while (
        storageService.obtener(
            STORAGE_KEYS.CUENTAS, []
        ).some(
            (cuenta) =>
                cuenta.numeroCuenta === numeroCuenta
        )
    );

    // Crear cuenta bancaria
    const nuevaCuenta = new Cuenta({
        numeroCuenta,
        tipo: 'Ahorro',
        saldo: 0,
        usuarioId: nuevoUsuario.id,
    });

    const cuentas = storageService.obtener(
        STORAGE_KEYS.CUENTAS, []
    );

    usuarios.push(nuevoUsuario);
    cuentas.push(nuevaCuenta);

    // Guardar información
    storageService.guardar(
        STORAGE_KEYS.USUARIOS, usuarios
    );

    storageService.guardar(
        STORAGE_KEYS.CUENTAS, cuentas
    );

    // Confirmar registro
    Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: 'Tu usuario y cuenta bancaria fueron creados correctamente.',
        confirmButtonText: 'Continuar',
    }).then(() => {
        document.querySelector(
            '#formRegistro'
        ).reset();

        document.querySelector(
            '#loginEmail'
        ).value = email;
    });
}

/* =========================================
   INICIO DE SESIÓN
========================================= */
function manejarLogin(event) {
    event.preventDefault();

    const email = document.querySelector(
        '#loginEmail'
    ).value.trim().toLowerCase();

    const password = document.querySelector(
        '#loginPassword'
    ).value;

    if (
        !validarCampoObligatorio(email) ||
        !validarCampoObligatorio(password)
    ) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Ingresa tu correo y contraseña.',
        });
        return;
    }

    try {
        const usuario = authService.login(
            email,
            password
        );

        Swal.fire({
            icon: 'success',
            title: `Bienvenido, ${usuario.nombre}`,
            text: 'Inicio de sesión correcto.',
            timer: 1500,
            showConfirmButton: false,
        }).then(() => {
            window.location.href = 'dashboard.html';
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'No fue posible iniciar sesión',
            text: error.message,
        });
    }
}

/* =========================================
   INICIALIZACIÓN
========================================= */
function init() {
    inicializarStorage();

    // Comprobar sesión existente
    if (authService.getCurrentUser()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const formLogin = document.querySelector(
        '#formLogin'
    );

    const formRegistro = document.querySelector(
        '#formRegistro'
    );

    if (formLogin) {
        formLogin.addEventListener(
            'submit',
            manejarLogin
        );
    }

    if (formRegistro) {
        formRegistro.addEventListener(
            'submit',
            manejarRegistro
        );
    }
}

init();
