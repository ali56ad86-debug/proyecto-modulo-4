
import { Banco } from '../models/Banco.js';
import { Usuario } from '../models/Usuario.js';
import { Cuenta } from '../models/Cuenta.js';
import { Movimiento } from '../models/Movimiento.js';

import {
    STORAGE_KEYS,
    storageService,
} from './StorageService.js';

class BancoService {
    constructor() {
        this._banco = null;
    }

    /* =========================================
       CARGA Y PERSISTENCIA
    ========================================= */

    cargarBanco() {
        const usuariosGuardados = storageService.obtener(
            STORAGE_KEYS.USUARIOS, []
        );

        const cuentasGuardadas = storageService.obtener(
            STORAGE_KEYS.CUENTAS, []
        );

        const movimientosGuardados = storageService.obtener(
            STORAGE_KEYS.MOVIMIENTOS, []
        );

        const usuarios = usuariosGuardados.map(
            (usuario) => new Usuario(usuario)
        );

        const cuentas = cuentasGuardadas.map(
            (cuenta) => new Cuenta(cuenta)
        );

        const movimientos = movimientosGuardados.map(
            (movimiento) => new Movimiento(movimiento)
        );

        this._banco = new Banco({
            usuarios,
            cuentas,
            movimientos,
        });

        return this._banco;
    }

    obtenerInstanciaBanco() {
        if (!this._banco) {
            return this.cargarBanco();
        }

        return this._banco;
    }

    recargarBanco() {
        this._banco = null;
        return this.cargarBanco();
    }

    guardarBanco() {
        const banco = this.obtenerInstanciaBanco();

        storageService.guardar(
            STORAGE_KEYS.USUARIOS, banco.usuarios
        );

        storageService.guardar(
            STORAGE_KEYS.CUENTAS, banco.cuentas
        );

        storageService.guardar(
            STORAGE_KEYS.MOVIMIENTOS, banco.movimientos
        );

        return true;
    }

    /* =========================================
       CONSULTAS DE USUARIO
    ========================================= */

    obtenerDatosUsuario(usuarioId) {
        const banco = this.obtenerInstanciaBanco();

        const usuario = banco.buscarUsuarioPorId(usuarioId);

        if (!usuario) {
            throw new Error('El usuario no existe.');
        }

        const cuentas = banco.obtenerCuentasDeUsuario(usuarioId);
        const cuentasIds = cuentas.map((cuenta) => cuenta.id);

        const movimientos = banco.movimientos.filter(
            (movimiento) => {
                if (movimiento.tipo === 'DEPOSITO') {
                    return cuentasIds.includes(movimiento.cuentaOrigen);
                }

                if (movimiento.tipo === 'TRANSFERENCIA_ENVIADA') {
                    return cuentasIds.includes(movimiento.cuentaOrigen);
                }

                if (movimiento.tipo === 'TRANSFERENCIA_RECIBIDA') {
                    return cuentasIds.includes(movimiento.cuentaDestino);
                }

                return false;
            }
        );

        return {
            usuario,
            cuentas,
            movimientos,
        };
    }

    obtenerResumenUsuario(usuarioId) {
        const {
            usuario,
            cuentas,
            movimientos,
        } = this.obtenerDatosUsuario(usuarioId);

        const saldoTotal = cuentas.reduce(
            (acumulado, cuenta) =>
                acumulado + Number(cuenta.saldo),
            0
        );

        return {
            usuario,
            cuentas,
            movimientos,
            saldoTotal,
            totalCuentas: cuentas.length,
            totalMovimientos: movimientos.length,
        };
    }

    /* =========================================
       HISTORIAL DE MOVIMIENTOS
    ========================================= */

    obtenerMovimientosUsuario(usuarioId, tipo = 'TODOS') {
        const { movimientos } = this.obtenerDatosUsuario(usuarioId);

        let resultado = [...movimientos];

        if (tipo !== 'TODOS') {
            resultado = resultado.filter(
                (movimiento) => movimiento.tipo === tipo
            );
        }

        resultado.sort(
            (a, b) => new Date(b.fecha) - new Date(a.fecha)
        );

        return resultado;
    }

    obtenerResumenMovimientos(usuarioId) {
        const movimientos = this.obtenerMovimientosUsuario(usuarioId);

        const depositos = movimientos.filter(
            (movimiento) => movimiento.tipo === 'DEPOSITO'
        ).length;

        const enviadas = movimientos.filter(
            (movimiento) => movimiento.tipo === 'TRANSFERENCIA_ENVIADA'
        ).length;

        const recibidas = movimientos.filter(
            (movimiento) => movimiento.tipo === 'TRANSFERENCIA_RECIBIDA'
        ).length;

        return {
            total: movimientos.length,
            depositos,
            enviadas,
            recibidas,
        };
    }

    /* =========================================
       OPERACIONES BANCARIAS
    ========================================= */

    realizarDeposito({
        cuentaId,
        monto,
        descripcion = '',
    }) {
        const banco = this.obtenerInstanciaBanco();

        const movimiento = banco.realizarDeposito({
            cuentaId,
            monto,
            descripcion,
        });

        this.guardarBanco();

        return movimiento;
    }

    realizarTransferencia({
        cuentaOrigenId,
        numeroCuentaDestino,
        monto,
        descripcion = '',
    }) {
        const banco = this.obtenerInstanciaBanco();

        const numeroDestino = String(numeroCuentaDestino)
            .replace(/\s/g, '')
            .trim();

        const cuentaDestino = banco.buscarCuentaPorNumero(
            numeroDestino
        );

        if (!cuentaDestino) {
            throw new Error('La cuenta destino no existe.');
        }

        const resultado = banco.realizarTransferencia({
            cuentaOrigenId,
            cuentaDestinoId: cuentaDestino.id,
            monto,
            descripcion,
        });

        this.guardarBanco();

        return resultado;
    }

    /* =========================================
       ACTUALIZACIÓN DE USUARIO
    ========================================= */

    actualizarUsuario(usuarioId, {
        nombre,
        email,
        telefono,
    }) {
        const usuarios = storageService.obtener(
            STORAGE_KEYS.USUARIOS, []
        );

        const usuario = usuarios.find(
            (item) => item.id === usuarioId
        );

        if (!usuario) {
            throw new Error('El usuario no existe.');
        }

        const emailNormalizado = String(email)
            .trim()
            .toLowerCase();

        const emailDuplicado = usuarios.some(
            (item) =>
                item.email.toLowerCase() === emailNormalizado &&
                item.id !== usuarioId
        );

        if (emailDuplicado) {
            throw new Error(
                'Ya existe un usuario con este correo.'
            );
        }

        const usuariosActualizados = usuarios.map(
            (item) =>
                item.id === usuarioId
                    ? {
                        ...item,
                        nombre: nombre.trim(),
                        email: emailNormalizado,
                        telefono: telefono.trim(),
                    }
                    : item
        );

        storageService.guardar(
            STORAGE_KEYS.USUARIOS,
            usuariosActualizados
        );

        this.recargarBanco();

        return usuariosActualizados.find(
            (item) => item.id === usuarioId
        ) || null;
    }

    /* =========================================
       CAMBIAR CONTRASEÑA
    ========================================= */

    cambiarPassword(usuarioId, passwordActual, passwordNueva) {
        const usuarios = storageService.obtener(
            STORAGE_KEYS.USUARIOS, []
        );

        const usuario = usuarios.find(
            (item) => item.id === usuarioId
        );

        if (!usuario) {
            throw new Error('El usuario no existe.');
        }

        if (usuario.password !== passwordActual) {
            throw new Error(
                'La contraseña actual no es correcta.'
            );
        }

        if (passwordNueva === passwordActual) {
            throw new Error(
                'La nueva contraseña debe ser diferente.'
            );
        }

        if (passwordNueva.length < 6) {
            throw new Error(
                'La nueva contraseña debe tener al menos 6 caracteres.'
            );
        }

        const usuariosActualizados = usuarios.map(
            (item) =>
                item.id === usuarioId
                    ? {
                        ...item,
                        password: passwordNueva,
                    }
                    : item
        );

        storageService.guardar(
            STORAGE_KEYS.USUARIOS,
            usuariosActualizados
        );

        this.recargarBanco();

        return true;
    }

    /* =========================================
       ELIMINAR USUARIO
    ========================================= */

    eliminarUsuario(usuarioId) {
        const usuarios = storageService.obtener(
            STORAGE_KEYS.USUARIOS, []
        );

        const cuentas = storageService.obtener(
            STORAGE_KEYS.CUENTAS, []
        );

        const movimientos = storageService.obtener(
            STORAGE_KEYS.MOVIMIENTOS, []
        );

        const usuario = usuarios.find(
            (item) => item.id === usuarioId
        );

        if (!usuario) {
            throw new Error('El usuario no existe.');
        }

        const cuentasUsuario = cuentas.filter(
            (cuenta) => cuenta.usuarioId === usuarioId
        );

        const tieneSaldo = cuentasUsuario.some(
            (cuenta) => Number(cuenta.saldo) > 0
        );

        if (tieneSaldo) {
            throw new Error(
                'No puedes eliminar tu cuenta mientras tengas saldo disponible.'
            );
        }

        const cuentasUsuarioIds = cuentasUsuario.map(
            (cuenta) => cuenta.id
        );

        const usuariosFiltrados = usuarios.filter(
            (item) => item.id !== usuarioId
        );

        const cuentasFiltradas = cuentas.filter(
            (cuenta) => cuenta.usuarioId !== usuarioId
        );

        const movimientosFiltrados = movimientos.filter(
            (movimiento) =>
                !cuentasUsuarioIds.includes(movimiento.cuentaOrigen) &&
                !cuentasUsuarioIds.includes(movimiento.cuentaDestino)
        );

        storageService.guardar(
            STORAGE_KEYS.USUARIOS,
            usuariosFiltrados
        );

        storageService.guardar(
            STORAGE_KEYS.CUENTAS,
            cuentasFiltradas
        );

        storageService.guardar(
            STORAGE_KEYS.MOVIMIENTOS,
            movimientosFiltrados
        );

        this.recargarBanco();

        return true;
    }
}

export const bancoService = new BancoService();
