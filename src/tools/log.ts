import fs from 'fs';

export function logUnauthorizedAccess(user_id: number, name: string){
  const log_file_path = "unauthorized_access.log";
  const timestamp = getCurrentTimestamp(process.env.TIMEZONE || "America/Chicago");
  const log_message = `[${timestamp}]: Attempted unauthorized access by ${name} (${user_id})`;

  console.warn(log_message);
  fs.appendFileSync(log_file_path, log_message + "\n");
}

export function logError(message: string){
  const log_file_path = "general.log";
  const timestamp = getCurrentTimestamp(process.env.TIMEZONE || "America/Chicago");
  const log_message = `[${timestamp}]: ERROR => ${message}`;

  console.error(log_message);
  fs.appendFileSync(log_file_path, log_message + "\n");
}

export function logInfo(message: string) {
  const log_file_path = "general.log";
  const timestamp = getCurrentTimestamp(process.env.TIMEZONE || "America/Chicago");
  const log_message = `[${timestamp}]: LOG => ${message}`;

  console.info(log_message);
  fs.appendFileSync(log_file_path, log_message + "\n");
}

function getCurrentTimestamp(timezone: string) {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  return now.toLocaleString('en-US', options);
}