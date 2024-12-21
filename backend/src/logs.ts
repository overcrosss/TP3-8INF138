import { Log, Database, LogAction } from "./types";
import { saveDatabaseToJSON } from "./database";

export const logsForUserId = (database: Database, userId: number): Array<Log> => {
  const logs = database.logs.filter(log => log.user_id === userId);
  
  // sort by descending order
  logs.sort((a, b) => b.done_at - a.done_at);
  
  return logs;
}

export const createLog = async (database: Database, userId: number, action: LogAction): Promise<void> => {
  const log: Log = {
    user_id: userId,
    action,
    done_at: Date.now()
  };

  database.logs.push(log);
  await saveDatabaseToJSON(database);
}
