// utils/dateFormatter.ts

/**
 * Formats a Date object into a DD/MM/YYYY string.
 * @param date The Date object to format.
 * @returns The formatted date string or '-' if the date is invalid.
 */
export const formatDateObj = (date: Date | undefined | null): string => {
    if (!date || isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Formats a date string (like 'YYYY-MM-DD' or an ISO string) into a DD/MM/YYYY string.
 * It correctly handles timezone offsets to prevent the date from being off by one day.
 * @param dateString The date string to format.
 * @returns The formatted date string or the original string if invalid.
 */
export const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';

    // If it's already in the desired format, return it.
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
    }

    const date = new Date(dateString);
    
    // For 'YYYY-MM-DD' strings, browsers often interpret them as UTC midnight.
    // This can result in the previous day when converted to local time.
    // To fix this, we check if the string is just a date and adjust it.
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);
        if (isNaN(correctedDate.getTime())) {
            return dateString;
        }
        return formatDateObj(correctedDate);
    }
    
    // For full ISO strings or other formats, standard conversion is usually fine.
    if (isNaN(date.getTime())) {
        return dateString; 
    }
    
    return formatDateObj(date);
};
