export interface Category {
  id: string
  name: string
  nameEn: string
  icon?: string
  children?: Category[]
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Хувь хүнийг хамгаалах хувцас хэрэгсэл",
    nameEn: "Personal protective equipment",
    icon: "shield",
    children: [
      {
        id: "1-1",
        name: "Толгойн хамгаалалт",
        nameEn: "Head protection",
        children: [
          {
            id: "1-1-1",
            name: "Малгай, каск",
            nameEn: "Hats, helmets",
          },
          {
            id: "1-1-2",
            name: "Нүүрний хамгаалалт, нүдний шил",
            nameEn: "Face protection, glasses",
          },
          {
            id: "1-1-3",
            name: "Гагнуурын баг, дагалдах хэрэгсэлт",
            nameEn: "Welding masks, accessories",
          },
          {
            id: "1-1-4",
            name: "Амьсгал хамгаалах маск, хошуувч",
            nameEn: "Respiratory protection masks, respirators",
          },
          {
            id: "1-1-5",
            name: "Чихэвч, чихний бөглөө",
            nameEn: "Earphones, earplugs",
          },
          {
            id: "1-1-6",
            name: "Баг шүүлтүүр",
            nameEn: "Filter bags",
          },
        ],
      },
      {
        id: "1-2",
        name: "Хамгаалалтын хувцас",
        nameEn: "Protective clothing",
        children: [
          {
            id: "1-2-1",
            name: "Зуны хувцас",
            nameEn: "Summer clothing",
          },
          {
            id: "1-2-2",
            name: "Өвлийн хувцас",
            nameEn: "Winter clothing",
          },
          {
            id: "1-2-3",
            name: "Цахилгаан, нуман ниргэлтээс хамгаалах хувцас хэрэглэл",
            nameEn: "Electrical, arc flash protective clothing",
          },
          {
            id: "1-2-4",
            name: "Гагнуурын хувцас хэрэгсэл",
            nameEn: "Welding clothing equipment",
          },
        ],
      },
      {
        id: "1-3",
        name: "Гар хамгаалах",
        nameEn: "Hand protection",
        children: [
          {
            id: "1-3-1",
            name: "Ажлын бээлий",
            nameEn: "Work gloves",
          },
          {
            id: "1-3-2",
            name: "Цахилгааны бээлий",
            nameEn: "Electrical gloves",
          },
          {
            id: "1-3-3",
            name: "Гагнуурын бээлий",
            nameEn: "Welding gloves",
          },
          {
            id: "1-3-4",
            name: "Халуунаас хамгаалах бээлий",
            nameEn: "Heat protective gloves",
          },
          {
            id: "1-3-5",
            name: "Хими, шүлт, цагцраас хамгаалах бээлий",
            nameEn: "Chemical, alkali, radiation protective gloves",
          },
        ],
      },
      {
        id: "1-4",
        name: "Хөл хамгаалалт",
        nameEn: "Foot protection",
        children: [
          {
            id: "1-4-1",
            name: "Ажлын гутал",
            nameEn: "Work boots",
          },
          {
            id: "1-4-2",
            name: "Гагнуурын гутал",
            nameEn: "Welding boots",
          },
          {
            id: "1-4-3",
            name: "Хүчил шүлт, цацрагаас хамгаах",
            nameEn: "Acid alkali, radiation protective",
          },
          {
            id: "1-4-4",
            name: "Усны гутал",
            nameEn: "Water boots",
          },
          {
            id: "1-4-5",
            name: "Цахилгаанаас хамгаалах",
            nameEn: "Electrical protective",
          },
        ],
      },
      {
        id: "1-5",
        name: "Өндрөөс хамгаалах хэрэгсэл",
        nameEn: "Fall protection equipment",
      },
    ],
  },
  {
    id: "2",
    name: "Аврах хамгаалах багаж хэрэгсэл",
    nameEn: "Rescue and protective equipment",
    icon: "gear",
    children: [
      {
        id: "2-1",
        name: "Аюулгүйн цоож пайз",
        nameEn: "Safety lock tag",
        children: [
          {
            id: "2-1-1",
            name: "Цоож",
            nameEn: "Lock",
          },
          {
            id: "2-1-2",
            name: "Түгжээ",
            nameEn: "Latch",
          },
          {
            id: "2-1-3",
            name: "Хайрцаг, стайшин",
            nameEn: "Box, station",
          },
          {
            id: "2-1-4",
            name: "Пайз",
            nameEn: "Tag",
          },
          {
            id: "2-1-5",
            name: "Иж бүрдэл, бусад",
            nameEn: "Kit, other",
          },
        ],
      },
      {
        id: "2-2",
        name: "Цахилгааны хамгаалалтын багаж",
        nameEn: "Electrical protection equipment",
        children: [
          {
            id: "2-2-1",
            name: "Хөндийрүүлэгч штанг",
            nameEn: "Insulating stick/rod",
          },
          {
            id: "2-2-2",
            name: "Цахилгаан дамжуулдаггүй зөөврийн хайс, шат",
            nameEn: "Non-conductive portable fence, ladder",
          },
          {
            id: "2-2-3",
            name: "Зөөврийн газардуулга",
            nameEn: "Portable grounding",
          },
          {
            id: "2-2-4",
            name: "Хүчдэл мэдрэгч",
            nameEn: "Voltage detector",
          },
          {
            id: "2-2-5",
            name: "Резин болон бусад тусгаарлах материал",
            nameEn: "Rubber and other insulating materials",
          },
        ],
      },
      {
        id: "2-3",
        name: "Тэмдэг тэмдэглэгээ",
        nameEn: "Signs and markings",
        children: [
          {
            id: "2-3-1",
            name: "Аюулын тэмдэг",
            nameEn: "Warning signs",
          },
          {
            id: "2-3-2",
            name: "Зааварчилгааны тэмдэг",
            nameEn: "Instruction signs",
          },
          {
            id: "2-3-3",
            name: "Хориглох тэмдэг",
            nameEn: "Prohibition signs",
          },
          {
            id: "2-3-4",
            name: "Сануулгын тэмдэг",
            nameEn: "Caution signs",
          },
          {
            id: "2-3-5",
            name: "Бусад тэмдэглэгээ",
            nameEn: "Other markings",
          },
        ],
      },
      {
        id: "2-4",
        name: "Гэрэл, чийдэн",
        nameEn: "Lights, lamps",
        children: [
          {
            id: "2-4-1",
            name: "Гэрлийн чийдэн",
            nameEn: "Light bulbs",
          },
          {
            id: "2-4-2",
            name: "Гэрлийн багаж",
            nameEn: "Lighting equipment",
          },
          {
            id: "2-4-3",
            name: "Тусгай гэрэл",
            nameEn: "Special lights",
          },
          {
            id: "2-4-4",
            name: "Гэрлийн хэрэгсэл",
            nameEn: "Lighting accessories",
          },
          {
            id: "2-4-5",
            name: "Бусад гэрэл",
            nameEn: "Other lights",
          },
        ],
      },
      {
        id: "2-5",
        name: "Осолын үеийн багаж хэрэгсэл",
        nameEn: "Emergency equipment",
        children: [
          {
            id: "2-5-1",
            name: "Аврах багаж",
            nameEn: "Rescue tools",
          },
          {
            id: "2-5-2",
            name: "Эхний тусламжийн багаж",
            nameEn: "First aid equipment",
          },
          {
            id: "2-5-3",
            name: "Аврах хэрэгсэл",
            nameEn: "Rescue equipment",
          },
          {
            id: "2-5-4",
            name: "Осол гамнаслын багаж",
            nameEn: "Accident prevention tools",
          },
          {
            id: "2-5-5",
            name: "Бусад осолын багаж",
            nameEn: "Other emergency equipment",
          },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Ажлын байрны хэвийн ажиллагааг хангах",
    nameEn: "Ensuring normal operation of the workplace",
    icon: "wrench",
    children: [
      {
        id: "3-1",
        name: "Дуу чимээ, тоосжилт",
        nameEn: "Noise, dust",
      },
    ],
  },
  {
    id: "4",
    name: "Бусад",
    nameEn: "Other",
    icon: "package",
    children: [
      {
        id: "4-1",
        name: "Бусад бүтээгдэхүүн",
        nameEn: "Other products",
      },
    ],
  },
]

// Helper function to get full category path
export function getCategoryPath(categoryId: string): string {
  for (const mainCat of categories) {
    if (mainCat.id === categoryId) {
      return mainCat.name
    }
    if (mainCat.children) {
      for (const subCat of mainCat.children) {
        if (subCat.id === categoryId) {
          return `${mainCat.name} / ${subCat.name}`
        }
        if (subCat.children) {
          for (const subSubCat of subCat.children) {
            if (subSubCat.id === categoryId) {
              return `${mainCat.name} / ${subCat.name} / ${subSubCat.name}`
            }
          }
        }
      }
    }
  }
  return ""
}

// Helper function to find category by ID
export function findCategoryById(categoryId: string): Category | null {
  for (const mainCat of categories) {
    if (mainCat.id === categoryId) {
      return mainCat
    }
    if (mainCat.children) {
      for (const subCat of mainCat.children) {
        if (subCat.id === categoryId) {
          return subCat
        }
        if (subCat.children) {
          for (const subSubCat of subCat.children) {
            if (subSubCat.id === categoryId) {
              return subSubCat
            }
          }
        }
      }
    }
  }
  return null
}

// Get all categories as flat list with paths
export function getAllCategoriesFlat(): Array<{ id: string; path: string; name: string }> {
  const result: Array<{ id: string; path: string; name: string }> = []
  
  for (const mainCat of categories) {
    result.push({
      id: mainCat.id,
      path: mainCat.name,
      name: mainCat.name,
    })
    
    if (mainCat.children) {
      for (const subCat of mainCat.children) {
        result.push({
          id: subCat.id,
          path: `${mainCat.name} / ${subCat.name}`,
          name: subCat.name,
        })
        
        if (subCat.children) {
          for (const subSubCat of subCat.children) {
            result.push({
              id: subSubCat.id,
              path: `${mainCat.name} / ${subCat.name} / ${subSubCat.name}`,
              name: subSubCat.name,
            })
          }
        }
      }
    }
  }
  
  return result
}

