
import { Movimiento } from './Movimiento.js';

export class Banco {

    /* =========================================
       CONSTRUCTOR
    ========================================= */
    constructor({
        usuarios = [],
        cuentas = [],
        movimientos = [],
    } = {}) {
        this.usuarios = usuarios;
        this.cuentas = cuentas;
        this.movimientos = movimientos;
    }

    /* =========================================
       USUARIOS
    ========================================= */
    agregarUsuario(usuario) {
        const existe = this.usuarios.some(
            (item) => item.id === usuario.id
        );

        if (existe) {
            throw new Error('El usuario ya existe.');
        }

        this.usuarios.push(usuario);
        return usuario;
    }

    buscarUsuarioPorId(usuarioId) {
        return this.usuarios.find(
            (usuario) => usuario.id === usuarioId
        ) || null;
    }

    /* =========================================
       CUENTAS
    ========================================= */
    agregarCuenta(cuenta) {
        const usuario = this.buscarUsuarioPorId(
            cuenta.usuarioId
        );

        if (!usuario) {
            throw new Error(
                'El usuario propietario de la cuenta no existe.'
            );
        }

        const existe = this.cuentas.some(
            (item) =>
                item.id === cuenta.id ||
                item.numeroCuenta === cuenta.numeroCuenta
        );

        if (existe) {
            throw new Error('La cuenta ya existe.');
        }

        this.cuentas.push(cuenta);
        return cuenta;
    }

    buscarCuentaPorId(cuentaId) {
        return this.cuentas.find(
            (cuenta) => cuenta.id === cuentaId
        ) || null;
    }

    buscarCuentaPorNumero(numeroCuenta) {
        return this.cuentas.find(
            (cuenta) => cuenta.numeroCuenta === numeroCuenta
        ) || null;
    }

    obtenerCuentasDeUsuario(usuarioId) {
        return this.cuentas.filter(
            (cuenta) => cuenta.usuarioId === usuarioId
        );
    }

    /* =========================================
       MOVIMIENTOS
    ========================================= */
    registrarMovimiento(movimiento) {
        this.movimientos.push(movimiento);
        return movimiento;
    }

    obtenerMovimientosDeCuenta(cuentaId) {
        return this.movimientos.filter(
            (movimiento) =>
                movimiento.cuentaOrigen === cuentaId ||
                movimiento.cuentaDestino === cuentaId
        );
    }

    /* =========================================
       DEPÓSITOS
    ========================================= */
    realizarDeposito({
        cuentaId,
        monto,
        descripcion = '',
    }) {
        const montoNumerico = Number(monto);

        if (
            !Number.isFinite(montoNumerico) ||
            montoNumerico <= 0
        ) {
            throw new Error(
                'Monto inválido, el monto debe ser mayor a cero.'
            );
        }

        const cuenta = this.buscarCuentaPorId(cuentaId);

        if (!cuenta) {
            throw new Error('La cuenta no existe.');
        }

        cuenta.depositar(montoNumerico);

        const movimiento = new Movimiento({
            tipo: 'DEPOSITO',
            monto: montoNumerico,
            descripcion,
            cuentaOrigen: cuenta.id,
            saldoResultante: cuenta.saldo,
        });

        this.registrarMovimiento(movimiento);

        return movimiento;
    }

    /* =========================================
       TRANSFERENCIAS
    ========================================= */
    realizarTransferencia({
        cuentaOrigenId,
        cuentaDestinoId,
        monto,
        descripcion = '',
    }) {
        const montoNumerico = Number(monto);

        // Validar monto
        if (
            !Number.isFinite(montoNumerico) ||
            montoNumerico <= 0
        ) {
            throw new Error(
                'Monto inválido, el monto debe ser mayor a cero.'
            );
        }

        // Buscar cuentas
        const origen = this.buscarCuentaPorId(cuentaOrigenId);
        const destino = this.buscarCuentaPorId(cuentaDestinoId);

        if (!origen) {
            throw new Error('La cuenta origen no existe.');
        }

        if (!destino) {
            throw new Error('La cuenta destino no existe.');
        }

        // Validar estado de las cuentas
        if (!origen.activa) {
            throw new Error('La cuenta origen no está activa.');
        }

        if (!destino.activa) {
            throw new Error('La cuenta destino no está activa.');
        }

        // Evitar transferencias a la misma cuenta
        if (origen.id === destino.id) {
            throw new Error(
                'No puedes transferir dinero a la misma cuenta'
            );
        }

        // Comprobar saldo suficiente
        if (origen.saldo < montoNumerico) {
            throw new Error('Saldo insuficiente');
        }

        // Actualizar saldos
        origen.retirar(montoNumerico);
        destino.depositar(montoNumerico);

        // Movimiento de salida
        const movimientoEnviado = new Movimiento({
            tipo: 'TRANSFERENCIA_ENVIADA',
            monto: montoNumerico,
            descripcion,
            cuentaOrigen: origen.id,
            cuentaDestino: destino.id,
            saldoResultante: origen.saldo,
        });

        // Movimiento de entrada
        const movimientoRecibido = new Movimiento({
            tipo: 'TRANSFERENCIA_RECIBIDA',
            monto: montoNumerico,
            descripcion,
            cuentaOrigen: origen.id,
            cuentaDestino: destino.id,
            saldoResultante: destino.saldo,
        });

        // Registrar ambos movimientos
        this.registrarMovimiento(movimientoEnviado);
        this.registrarMovimiento(movimientoRecibido);

        return {
            origen,
            destino,
            movimientoEnviado,
            movimientoRecibido,
        };
    }
}
