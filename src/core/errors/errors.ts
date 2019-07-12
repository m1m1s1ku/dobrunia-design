/**
 * Elara generic errors
 */
export class GenericError extends Error {
    public elara: boolean = false;
    public continue: boolean = true;
    public reload: boolean = true;
    public underlyingError: Error;
}

export class NotFoundError extends Error {
    public elara: boolean = true;
    public continue: boolean = true;
    public reload: boolean = false;
    public underlyingError: Error;
}

export class PrototypeError extends Error {
    public elara: boolean = false;
    public continue: boolean = true;
    public reload: boolean = false;
    public underlyingError: Error;
}