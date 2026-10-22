
/* =========================================
   GENERAR ID
========================================= */
export function generarId() {
    return `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
}

/* =========================================
   GENERAR NÚMERO DE CUENTA
========================================= */
export function generarNumeroCuenta() {

    // CADENA INICIAL
    let numeroCuenta = '';

    // GENERAR 12 DÍGITOS
    for (
        let i = 0;
        i < 12;
        i += 1
    ) {
        /* Generamos un número aleatorio
           entero entre 0 y 9. */
        numeroCuenta +=
            Math.floor(
                Math.random() * 10,
            );
    }

    /* =====================================
       DEVOLVER NÚMERO
    ===================================== */
    return numeroCuenta;
}
