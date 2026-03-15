import { group, rectangle } from "vitrine";
import type { Block, GroupProps } from "vitrine";
import type {
  TableCellLayout,
  TableCellMeasurer,
  TableLayoutResult,
  TableModel,
  TableRenderDelegate
} from "vitrine-tables";

export interface VitrineIntrinsicSize {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
}

export interface VitrineCellRenderContext {
  frame: TableCellLayout;
  contentWidth: number;
  contentHeight: number;
  insetX: number;
  insetY: number;
}

export interface VitrineTableCellContent {
  blocks?: Block[];
  renderBlocks?: (context: VitrineCellRenderContext) => Block[];
  intrinsicSize?: VitrineIntrinsicSize;
}

export interface VitrineMeasurerOptions {
  measure?: (content: VitrineTableCellContent) => VitrineIntrinsicSize;
  fallback?: VitrineIntrinsicSize;
}

export function createVitrineTableCellMeasurer(
  options: VitrineMeasurerOptions = {}
): TableCellMeasurer<VitrineTableCellContent> {
  const fallback = options.fallback ?? {
    minWidth: 0,
    maxWidth: Number.POSITIVE_INFINITY,
    minHeight: 0
  };

  return {
    measureIntrinsicSize(content: VitrineTableCellContent): VitrineIntrinsicSize {
      if (options.measure !== undefined) {
        return options.measure(content);
      }

      if (content.intrinsicSize !== undefined) {
        return content.intrinsicSize;
      }

      return fallback;
    }
  };
}

export interface VitrineRenderDelegateOptions {
  clipCellContent?: boolean;
  insetX?: number;
  insetY?: number;
  frameStroke?: string;
  frameStrokeWidth?: number;
  frameFill?: string;
}

export function createVitrineTableRenderDelegate(
  options: VitrineRenderDelegateOptions = {}
): TableRenderDelegate<VitrineTableCellContent, Block> {
  const insetX = options.insetX ?? 0;
  const insetY = options.insetY ?? 0;

  return {
    renderCell(content: VitrineTableCellContent, frame: TableCellLayout): Block {
      const children: Block[] = [];

      if (options.frameFill !== undefined || options.frameStroke !== undefined) {
        children.push(
          rectangle({
            x: 0,
            y: 0,
            dx: frame.width,
            dy: frame.height,
            fill: options.frameFill,
            stroke: options.frameStroke,
            strokeWidth: options.frameStrokeWidth ?? 1
          })
        );
      }

      const contentGroupProps: GroupProps = {
        x: insetX,
        y: insetY,
        clip: options.clipCellContent ?? false
      };

      const contentBlocks = content.renderBlocks !== undefined
        ? content.renderBlocks({
            frame,
            contentWidth: Math.max(0, frame.width - insetX * 2),
            contentHeight: Math.max(0, frame.height - insetY * 2),
            insetX,
            insetY
          })
        : (content.blocks ?? []);

      children.push(group(contentGroupProps, contentBlocks));

      return group({ x: frame.x, y: frame.y }, children);
    }
  };
}

function indexTableCellsById<TCellContent>(
  table: TableModel<TCellContent>
): Record<string, TCellContent> {
  const map: Record<string, TCellContent> = {};

  const copyFromSection = (section: TableModel<TCellContent>["header"] | TableModel<TCellContent>["body"] | TableModel<TCellContent>["footer"]): void => {
    if (section === undefined) {
      return;
    }

    for (const cell of section.cells) {
      map[cell.id] = cell.content;
    }
  };

  copyFromSection(table.header);
  copyFromSection(table.body);
  copyFromSection(table.footer);

  return map;
}

export interface BuildVitrineBlocksFromTableLayoutOptions {
  rootGroupProps?: GroupProps;
}

export function buildVitrineBlocksFromTableLayout<TCellContent>(
  table: TableModel<TCellContent>,
  layout: TableLayoutResult,
  delegate: TableRenderDelegate<TCellContent, Block>,
  options: BuildVitrineBlocksFromTableLayoutOptions = {}
): Block {
  const mapContentByCellId = indexTableCellsById(table);

  const children: Block[] = layout.cells.flatMap((frame: TableCellLayout) => {
    const content = mapContentByCellId[frame.cellId];
    if (content === undefined) {
      return [];
    }
    return [delegate.renderCell(content, frame)];
  });

  return group(options.rootGroupProps ?? {}, children);
}
