import { DateTime } from 'luxon';

export function formatDate(date: Date | string): string | null {
    if (date instanceof Date) {
        return DateTime.fromJSDate(date).toISO();
    } else if (typeof date === 'string') {
        return DateTime.fromISO(date).toISO();
    }
    return null;
}

export function str2Date(str: string): Date {
    if (!str) return null;
    return DateTime.fromISO(str).toJSDate();
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function escapeRegexString(regexString: string): string {
    const sre = new RegExp(
        '(\\' +
            ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '^'].join('|\\') +
            ')',
        'g',
    );
    return regexString.replace(sre, '\\$1');
}
