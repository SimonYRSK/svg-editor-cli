import type { Command } from '../../../app/Command.js';
import type { CommandRegistry } from '../../../app/CommandRegistry.js';
import type { Editor } from '../../../app/Editor.js';

/** `help`: every registered command with its syntax. Built from the registry, never hard coded. */
export class HelpCommand implements Command {
  readonly name = 'help';
  readonly syntax = 'help';
  readonly summary = 'show this list';

  private readonly registry: CommandRegistry;

  constructor(registry: CommandRegistry) {
    this.registry = registry;
  }

  execute(_args: readonly string[], _editor: Editor): string {
    const commands = this.registry.list();
    const width = commands.reduce((widest, command) => Math.max(widest, command.syntax.length), 0);
    const lines = ['commands:'];
    for (const command of commands) {
      lines.push(`  ${command.syntax.padEnd(width)}  ${command.summary}`);
    }
    lines.push('', '# starts a comment; blank lines are ignored; Ctrl-D leaves the editor');
    return lines.join('\n');
  }
}
