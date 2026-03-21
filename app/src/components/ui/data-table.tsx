"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { usePagination } from "@/components/hooks/use-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchValue?: string
  pageSize?: number
  emptyMessage?: string
  className?: string
}

function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchValue,
  pageSize = 10,
  emptyMessage = "No results found.",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  React.useEffect(() => {
    if (searchKey && searchValue !== undefined) {
      setColumnFilters((prev) => {
        const others = prev.filter((f) => f.id !== searchKey)
        if (searchValue) {
          return [...others, { id: searchKey, value: searchValue }]
        }
        return others
      })
    }
  }, [searchKey, searchValue])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  })

  return (
    <div data-slot="data-table" className={cn("flex flex-col gap-4", className)}>
      <div className="rounded-xl bg-white ring-1 ring-gray-200/60 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200/60">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.03, 0.3),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <DataTablePagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPageChange={(p) => table.setPageIndex(p - 1)}
        />
      )}
    </div>
  )
}

function DataTablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay: 7,
  })

  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <Pagination className="w-auto mx-0 justify-end">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous page</span>
              &larr;
            </Button>
          </PaginationItem>

          {showLeftEllipsis && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {showRightEllipsis && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => onPageChange(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next page</span>
              &rarr;
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function SortableHeader({
  column,
  children,
}: {
  column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" }
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown className="ml-1 size-3.5" />
    </Button>
  )
}

export { DataTable, SortableHeader }
export type { DataTableProps }
