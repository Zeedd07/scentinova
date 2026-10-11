/**
 * Table from the md breakpoint up; a list of cards on phones, where wide tables don't fit.
 * columns: [{ key, header, cell: (row) => node, className?, headClassName? }]
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export default function ResponsiveTable({
  columns,
  rows,
  rowKey,
  renderCard,
  rowClassName,
  caption,
  className,
}) {
  const keyOf = (row, index) => (rowKey ? rowKey(row) : index)
  return (
    <div className={className}>
      <ul className="divide-y divide-[#ebe4d6] border border-border bg-background md:hidden" aria-label={caption}>
        {rows.map((row, index) => (
          <li key={keyOf(row, index)} className={cn('px-4 py-3', rowClassName?.(row))}>
            {renderCard(row)}
          </li>
        ))}
      </ul>
      <div className="hidden border border-border bg-background md:block">
        <Table>
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn('h-10 px-4 text-[12px] font-semibold text-[#4a4136]', col.headClassName)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={keyOf(row, index)} className={cn('border-[#ebe4d6]', rowClassName?.(row))}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn('px-4 py-3 text-[14px] whitespace-normal', col.className)}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
