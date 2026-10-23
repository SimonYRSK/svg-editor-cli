import type { Readable, Writable } from 'node:stream';
import { AddToCommand } from './app/commands/AddToCommand.js';
import { CanvasCommand } from './app/commands/CanvasCommand.js';
import { CreateCommand } from './app/commands/CreateCommand.js';
import { DeleteCommand } from './app/commands/DeleteCommand.js';
import { GroupCommand } from './app/commands/GroupCommand.js';
import { InitCommand } from './app/commands/InitCommand.js';
import { MoveCommand } from './app/commands/MoveCommand.js';
import { ReadCommand } from './app/commands/ReadCommand.js';
import { RedoCommand } from './app/commands/RedoCommand.js';
import { ReorderCommand } from './app/commands/ReorderCommand.js';
import { SaveCommand } from './app/commands/SaveCommand.js';
import { ScaleCommand } from './app/commands/ScaleCommand.js';
import { SetCommand } from './app/commands/SetCommand.js';
import { UndoCommand } from './app/commands/UndoCommand.js';
import { UngroupCommand } from './app/commands/UngroupCommand.js';
import { CommandRegistry } from './app/CommandRegistry.js';
import type { Command } from './app/Command.js';
import { Editor } from './app/Editor.js';
import { NodeFileStore } from './io/NodeFileStore.js';
import type { FileStore } from './io/FileStore.js';
import { SvgReader } from './io/SvgReader.js';
import { SvgWriter } from './io/SvgWriter.js';
import { KernelShapeTypes } from './model/shapes/KernelShapeTypes.js';
import { ExitCommand } from './presentation/cli/commands/ExitCommand.js';
import { HelpCommand } from './presentation/cli/commands/HelpCommand.js';
import { ShowCommand } from './presentation/cli/commands/ShowCommand.js';
import { TreeCommand } from './presentation/cli/commands/TreeCommand.js';
import { LineInterpreter } from './presentation/cli/LineInterpreter.js';
import { Repl } from './presentation/cli/Repl.js';
import type { ReplOptions } from './presentation/cli/ReplOptions.js';
import { ShowFormatter } from './presentation/cli/ShowFormatter.js';
import { TreeFormatter } from './presentation/cli/TreeFormatter.js';

/**
 * The composition root: the only place that knows every layer at once.
 *
 * Wiring lives here and nowhere else: the kernel type registry is built, the
 * shape codec and the file store are chosen, the command objects are created
 * and registered, and the editor session is handed to the interpreter. Tests
 * reuse this class with an in-memory `FileStore`.
 */
export class CompositionRoot {
  private readonly files: FileStore;
  private session: Editor | null = null;

  constructor(files: FileStore = new NodeFileStore()) {
    this.files = files;
  }

  /** The editor session built by the last `createInterpreter()` (handy for tests). */
  get editor(): Editor {
    if (this.session === null) throw new Error('call createInterpreter() first');
    return this.session;
  }

  createInterpreter(): LineInterpreter {
    const shapeTypes = KernelShapeTypes.createRegistry();
    const editor = new Editor(shapeTypes);
    const registry = new CommandRegistry();
    const treeFormatter = new TreeFormatter();
    const showFormatter = new ShowFormatter();

    const commands: readonly Command[] = [
      new InitCommand(),
      new ReadCommand(this.files, new SvgReader(shapeTypes)),
      new SaveCommand(this.files, new SvgWriter()),
      new CanvasCommand(),
      new CreateCommand(),
      new DeleteCommand(),
      new MoveCommand(),
      new ScaleCommand(),
      new SetCommand(),
      new GroupCommand(),
      new UngroupCommand(),
      new AddToCommand(),
      new ReorderCommand('front'),
      new ReorderCommand('back'),
      new UndoCommand(),
      new RedoCommand(),
      new TreeCommand(treeFormatter),
      new ShowCommand(showFormatter),
    ];
    for (const command of commands) registry.register(command);

    const exit = new ExitCommand();
    registry.register(exit);
    registry.registerAlias('quit', exit);
    registry.register(new HelpCommand(registry));

    this.session = editor;
    return new LineInterpreter(registry, editor);
  }

  createRepl(input: Readable, output: Writable, options: ReplOptions = {}): Repl {
    return new Repl(input, output, this.createInterpreter(), options);
  }
}
