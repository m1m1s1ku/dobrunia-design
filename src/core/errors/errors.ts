/**
 * Elara generic errors
 */
export class GenericError extends Error {
    public elara = false;
    public continue = true;
    public reload = true;
    public underlyingError: Error;
}

export class NotFoundError extends Error {
    public elara = true;
    public continue = true;
    public reload = false;
    public underlyingError: Error;
}


export class NetworkError extends Error {
    public elara = false;
    public continue = false;
    public reload = true;
    public network = true;
    public underlyingError: Error;
}

export class PrototypeError extends Error {
    public elara = false;
    public continue = true;
    public reload = false;
    public underlyingError: Error;
}

export function wrap(underlying: Error): CustomEvent<Error> {
    const err = new NetworkError('Erreur réseau');
    err.underlyingError = underlying;

    return new CustomEvent('error', {
        detail: err,
        composed: true,
        bubbles: true
    });
}