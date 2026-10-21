/* =========================================
        VALIDACIONES GENERALES
========================================= */

/* =========================================
        VALIDAR CAMPO OBLIGATORIO
========================================= */

/* Comprueba que un dato obligatorio realmente contenga información. */
export function validarCampoObligatorio(valor) {
    return (
        valor !== undefined &&
        valor !== null &&
        String(valor).trim() !== ''
    );
}

/* =========================================
        VALIDAR MONTO
========================================= */

/* Comprueba que el monto recibido represente un número válido mayor a cero. */
export function validarMonto(monto) {
    const montoNumerico = Number(monto);

    return (
        Number.isFinite(montoNumerico) &&
        montoNumerico > 0
    );
}