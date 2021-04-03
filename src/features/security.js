import {base64decode} from "../lib/base64";

const crypto = require("crypto");
const constants = require("constants");

const privateKey = '-----BEGIN OPENSSH PRIVATE KEY-----\n' +
    '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\n' +
    'tVQnddnz/2zMcD2JqlkoEOEPAAYu8=\n' +
    '-----END OPENSSH PRIVATE KEY-----'

const publicKey = '----- BEGIN PUBLIC KEY ----- AAAAB3NzaC1yc2EAAAADAQABAAABAQCzUH/y6USfX/zdgItLzNW7Tueg+XeIshPd7d4lZYi8BoBbjiIp1Q8AG9M0VPCcGBW0MVeBrPzigwJLt12TMtaNos23fd4SKOoMlWEDAVnsPu8Colmt67GjU+dYxmILYB5BjDCMvEcR4Hrny3qCzOhf/HZwLkCqhguf1992hoezxOBk9cYPQBZllail7saWJ2x94thGtu9zglb3DiNtQPlqIuYriNgBrlTohalvEvDVkcErHMMEC8cLv9BsLDN8WEgZl7crujPr+ptp9+h6bxUW7Zy5SZiuhzbOf503ZYEtBt87DrQXvoFPxN8aRm7gzmUHMKXag/ALCEnuKsUGHv6J ----- END PUBLIC KEY -----'

export function encrypt(value) {
    const bufferToEncrypt = new Buffer(value)
    const encrypted = crypto.privateEncrypt({
        key: privateKey, padding: constants.RSA_PKCS1_PADDING},
        bufferToEncrypt
    )
    return encrypted.toString("base64")
}

export function decrypt(value) {
    const bufferToDecrypt = new Buffer(base64decode(value))
    const decrypted = crypto.publicDecrypt(publicKey, bufferToDecrypt)
    return decrypted
}
