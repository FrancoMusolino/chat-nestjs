export const convertDateToArgTZ = (date: Date): string =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Buenos_Aires',
    dateStyle: 'long',
    timeStyle: 'medium',
  }).format(date);
