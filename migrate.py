import re
import os

create_file = 'resources/js/pages/setup/items/create.tsx'
edit_file = 'resources/js/pages/setup/items/edit.tsx'

with open(create_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Breadcrumbs
content = content.replace('title: "Create"', 'title: "Edit"').replace('href: "/items/create"', 'href: "/items/edit"')

# 2. Update Icons Import to Include Chevrons
content = re.sub(r'(import \{.*?), (Ruler, BadgePercent)(\} from "lucide-react")', r'\1, \2, ChevronLeft, ChevronRight\3', content)

# 3. Update Page Component Props
content = re.sub(
    r'export default function Page\(\{ categories, companies \}: \{ categories: any, companies: any \}\) \{',
    '''interface Props {
  item: any
  categories: any
  companies: any
  pagination: {
    prev_id: number | null
    next_id: number | null
    current: number
    total: number
  }
}

export default function Page({ item, categories, companies, pagination }: Props) {''', 
    content
)

# 4. Update initialDate state setup
content = content.replace('''  // date picker state
  const [openingDate, setOpeningDate] = useState<Date | undefined>(new Date());
  const [openingOpen, setOpeningOpen] = useState(false)''',
  '''  // date picker state
  const initialDate = item.date ? new Date(item.date) : undefined
  const [openingDate, setOpeningDate] = useState<Date | undefined>(initialDate)
  const [openingOpen, setOpeningOpen] = useState(false)''')


# 5. Update useForm initialization and destructure 'put'
content = content.replace('const { data, setData, post, processing, errors, reset, isDirty } = useForm<ItemForm>({', 'const { data, setData, put, processing, errors, reset, isDirty } = useForm<ItemForm>({')

fields = [
    'date', 'code', 'title', 'short_name', 'company', 'trade_price', 'retail', 'retail_tp_diff', 'reorder_level', 
    'packing_qty', 'packing_size', 'pcs', 'formation', 'type', 'category', 'shelf', 'gst_percent', 'gst_amount', 
    'adv_tax_filer', 'adv_tax_non_filer', 'adv_tax_manufacturer', 'discount', 'packing_full', 'packing_pcs', 'limit_pcs', 
    'order_qty', 'weight', 'stock_1', 'stock_2', 'pt2', 'pt3', 'pt4', 'pt5', 'pt6', 'pt7', 'scheme'
]

bool_fields = ['is_import', 'is_fridge', 'is_active', 'is_recipe']

for field in fields:
    content = re.sub(rf'    {field}: [^,\n]+,', rf'    {field}: item.{field} ?? "",', content)

for field in bool_fields:
    content = re.sub(rf'    {field}: [^,\n]+,', rf'    {field}: !!item.{field},', content)

# 6. Remove Next-code Auto-fetch completely
content = re.sub(
    r'  // Autogenerate Item Code on Category change\n  useEffect\(\(\) => \{\n    if \(data\.category && data\.code === ""\) \{\n      axios\.get\(`/items/next-code\?category_id=\$\{data\.category\}`\)\n        \.then\(res => \{\n          if \(res\.data\.code\) \{\n            setData\("code", res\.data\.code\);\n          \}\n        \}\)\n        \.catch\(err => console\.error\("Error fetching next code:", err\)\);\n    \}\n  \}, \[data\.category\]\);\n',
    '',
    content
)

# 7. Update submit handler to process PUT request and use correct initialDate reset
content = re.sub(
    r'    post\("/items", \{\n      onSuccess: \(\) => \{\n        toast\.success\("Item created successfully"\)\n        reset\(\)\n        setOpeningDate\(undefined\)\n      \},\n      onError: \(errs\) => \{\n        console\.error\("Validation Errors:", errs\)\n        const errorMessages = Object\.values\(errs\)\n        if \(errorMessages\.length > 0\) \{\n          toast\.error\(String\(errorMessages\[0\]\)\)\n        \} else \{\n          toast\.error\("Please fix the errors and try again"\)\n        \}\n      \},\n    \}\)',
    '''    const payload = {
      ...data,
      date: openingDate ? openingDate.toISOString().split("T")[0] : data.date,
    }

    put(`/items/${item.id}`, {
      onSuccess: () => toast.success("Item updated successfully"),
      onError: (errs) => {
        console.error("Validation Errors:", errs)
        const errorMessages = Object.values(errs)
        if (errorMessages.length > 0) {
          toast.error(String(errorMessages[0]))
        } else {
          toast.error("Please fix the errors and try again")
        }
      },
    })''',
    content
)

content = content.replace('setOpeningDate(undefined)', 'setOpeningDate(initialDate)')

# 8. Add Pagination chunk right after <main...>
pagination_html = '''

            {/* Pagination Controls moved to the top of main area */}
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm shadow-zinc-200/50 dark:shadow-none mb-6">
              <div className="flex items-center gap-2">
                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 ${PREMIUM_ROUNDING_MD} bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20`}>
                  Editing Item: {item.title || item.code || "N/A"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-9 rounded-none border-r border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                    disabled={!pagination.prev_id}
                    onClick={() => pagination.prev_id && router.visit(`/items/${pagination.prev_id}/edit`)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-9 rounded-none text-zinc-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                    disabled={!pagination.next_id}
                    onClick={() => pagination.next_id && router.visit(`/items/${pagination.next_id}/edit`)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tabular-nums px-2">
                  {pagination.current} <span className="font-normal text-zinc-400">of</span> {pagination.total}
                </div>
              </div>
            </div>'''
            
content = content.replace('<main className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-6">', '<main className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-6">' + pagination_html)

# 9. Update Button
content = content.replace('Create Item', 'Update Item')

with open(edit_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Migration generated successfully!")
