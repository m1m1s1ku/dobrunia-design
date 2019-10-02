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

export class PrototypeError extends Error {
    public elara = false;
    public continue = true;
    public reload = false;
    public underlyingError: Error;
}