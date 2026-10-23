import { UnknownCommandError } from '../model/errors/UnknownCommandError.js';
import type { Command } from './Command.js';

/**
 * Command name -> command object table.
 *
 * This is the second (and last) name based dispatch of the kernel.  It is a
 * plugin seam on purpose: a new command is a new class plus one `register`
 * call, never an extra branch inside an existing `switch`.
 */
export class CommandRegistry {
  private readonly commandsByName = new Map<string, Command>();

  register(command: Command): void {
    if (this.commandsByName.has(command.name)) {
      throw new Error(`command already registered: ${command.name}`);
    }
    this.commandsByName.set(command.name, command);
  }

  /** Registers the same command object under a second name (`quit` for `exit`). */
  registerAlias(alias: string, command: Command): void {
    if (this.commandsByName.has(alias)) {
      throw new Error(`command already registered: ${alias}`);
    }
    this.commandsByName.set(alias, command);
  }

  /** @throws UnknownCommandError */
  resolve(name: string): Command {
    const command = this.commandsByName.get(name);
    if (command === undefined) throw new UnknownCommandError(name);
    return command;
  }

  list(): readonly Command[] {
    return [...this.commandsByName.values()];
  }
}
