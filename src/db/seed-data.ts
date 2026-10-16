import type { ProductOption } from "./schema";

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

export const seedCategories = [
  {
    slug: "ceilings",
    name: "أسقف الجبس بورد",
    description: "أسقف معلقة بإضاءة مخفية وتصاميم هندسية راقية",
    image: px(6238608),
  },
  {
    slug: "walls",
    name: "ديكور الجدران والتلفزيون",
    description: "وحدات تلفزيون ونيشات وبانوهات جدارية فاخرة",
    image: px(6585766),
  },
  {
    slug: "paint",
    name: "الدهانات والرنج",
    description: "دهانات بلاستيك وزيتي وديكورية بأيدي صنايعية مهرة",
    image: px(7218683),
  },
  {
    slug: "partitions",
    name: "الفواصل والتقسيمات",
    description: "فواصل جبس بورد عازلة للصوت والحرارة",
    image: px(11427405),
  },
  {
    slug: "packages",
    name: "باقات التشطيب الكاملة",
    description: "تجديد غرفة أو شقة كاملة بسعر واضح وتسليم مضمون",
    image: px(7166945),
  },
];

const finish3 = (a: number, b: number): ProductOption[] => [
  { label: "اقتصادي", priceDelta: 0 },
  { label: "متوسط", priceDelta: a },
  { label: "فاخر", priceDelta: b },
];

export type SeedProduct = {
  slug: string;
  category: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  unit: string;
  minQty: number;
  step: number;
  images: string[];
  options: ProductOption[];
  optionsLabel?: string;
  features: string[];
  badge?: string;
  featured?: boolean;
  sales: number;
  leadTime?: string;
};

export const seedProducts: SeedProduct[] = [
  {
    slug: "flat-gypsum-ceiling",
    category: "ceilings",
    name: "سقف جبس بورد مسطح بتشطيب ناعم",
    shortDescription: "سقف معلق ناعم بدون فواصل ظاهرة، مثالي لكل الغرف.",
    description:
      "سقف جبس بورد مسطح يُنفَّذ على هيكل معدني مجلفن مقاوم للصدأ، مع معالجة كاملة للفواصل بشريط وعجينة متخصصة لنحصل على سطح أملس تمامًا جاهز للدهان. يخفي الأسلاك والمواسير ويمنحك ارتفاعًا متناسقًا وإضاءة موزعة بإتقان.\n\nيشمل السعر الخامات والعمالة والمعاينة المجانية، ويمكن إضافة فتحات الإضاءة والتكييف حسب التصميم.",
    price: 280,
    compareAtPrice: 320,
    unit: "م²",
    minQty: 10,
    step: 1,
    images: [px(6980724), px(6238608), px(11427524), px(7166945)],
    options: [
      { label: "ألواح عادية", priceDelta: 0 },
      { label: "ألواح مقاومة للرطوبة", priceDelta: 45 },
      { label: "ألواح مقاومة للحريق", priceDelta: 70 },
    ],
    optionsLabel: "نوع الألواح",
    features: [
      "هيكل معدني مجلفن بسُمك ٠٫٥ مم",
      "ألواح جبس بورد بسُمك ١٢٫٥ مم",
      "معالجة فواصل بالشريط والعجينة",
      "ضمان تنفيذ ٥ سنوات",
    ],
    badge: "الأكثر مبيعًا",
    featured: true,
    sales: 412,
  },
  {
    slug: "cove-lighting-ceiling",
    category: "ceilings",
    name: "سقف جبس بإضاءة مخفية (كوف لايت)",
    shortDescription: "إضاءة ناعمة تنساب من حواف السقف لأجواء فندقية.",
    description:
      "سقف جبس بورد بحواف غائرة تحتضن شريط LED عالي الكفاءة لإضاءة غير مباشرة تمنح الغرفة عمقًا ودفئًا. نختار معك درجة الإضاءة (دافئة / محايدة / RGB) ونمدّ التمديدات الكهربائية بإتقان مع لوحات تحكم مخفية.\n\nمناسب لغرف المعيشة والنوم والممرات والمحال التجارية.",
    price: 420,
    compareAtPrice: 480,
    unit: "م²",
    minQty: 10,
    step: 1,
    images: [px(6238607), px(6444242), px(6238608), px(7546230)],
    options: [
      { label: "إضاءة دافئة ٣٠٠٠K", priceDelta: 0 },
      { label: "إضاءة محايدة ٤٠٠٠K", priceDelta: 0 },
      { label: "RGB بريموت وتحكم بالموبايل", priceDelta: 90 },
    ],
    optionsLabel: "نوع الإضاءة",
    features: [
      "شريط LED بجودة عالية وعمر ٣٠٬٠٠٠ ساعة",
      "محول وتمديدات كهربائية آمنة",
      "تصميم ثلاثي الأبعاد قبل التنفيذ",
      "ضمان الإضاءة سنتان",
    ],
    badge: "جديد",
    featured: true,
    sales: 356,
  },
  {
    slug: "geometric-arch-ceiling",
    category: "ceilings",
    name: "سقف معلق بتصميم هندسي وأقواس",
    shortDescription: "تصاميم فنية متعددة المستويات للصالات والريسبشن.",
    description:
      "لمسة معمارية تصنع الفارق: سقف متعدد المستويات بأقواس ودوائر وأشكال هندسية تُنفَّذ بدقة بالغة وتُدمج مع الثريات والإضاءة المخفية. نبدأ بتصميم مبدئي يناسب مساحتك وذوقك ثم ننفذه بأيدي فنيين متخصصين.",
    price: 520,
    unit: "م²",
    minQty: 8,
    step: 1,
    images: [px(8135119), px(6980724), px(6238608)],
    options: finish3(80, 160),
    features: [
      "تصميم مخصص حسب المساحة",
      "دمج الثريات والسبوت لايت",
      "تشطيب جاهز للدهان",
      "متابعة مهندس أثناء التنفيذ",
    ],
    featured: true,
    sales: 187,
    leadTime: "خلال ٧ - ١٢ يوم عمل",
  },
  {
    slug: "classic-gypsum-cornice",
    category: "ceilings",
    name: "كرانيش جبس كلاسيك بنقوش بارزة",
    shortDescription: "كرانيش أنيقة تُكمل الإطار بين السقف والجدار.",
    description:
      "كرانيش جبس مصبوبة بنقوش كلاسيكية ومودرن بعدة عروض، تُثبَّت وتُعالج وصلاتها بإتقان لتبدو قطعة واحدة. اختر العرض المناسب لارتفاع غرفتك ونحن نتولى التركيب والدهان.",
    price: 95,
    unit: "متر طولي",
    minQty: 20,
    step: 1,
    images: [px(8141956), px(7148779), px(6987730)],
    options: [
      { label: "عرض ٨ سم", priceDelta: 0 },
      { label: "عرض ١٢ سم", priceDelta: 25 },
      { label: "عرض ١٨ سم", priceDelta: 55 },
    ],
    optionsLabel: "عرض الكرنيش",
    features: ["جبس صب عالي الكثافة", "تركيب بلا فواصل ظاهرة", "قابل للدهان بأي لون"],
    sales: 143,
  },
  {
    slug: "bedroom-double-level-ceiling",
    category: "ceilings",
    name: "سقف غرف النوم مزدوج المستوى",
    shortDescription: "هدوء وفخامة بإضاءة ناعمة وتصميم مريح للعين.",
    description:
      "تصميم سقف مخصص لغرف النوم بمستويين وحواف منحنية وإضاءة خافتة تساعد على الاسترخاء. يمكن دمجه مع ستائر مخفية (بوكس ستارة) وإضاءة رأس السرير لتكتمل الصورة.",
    price: 480,
    compareAtPrice: 540,
    unit: "م²",
    minQty: 8,
    step: 1,
    images: [px(6394592), px(8089187), px(7546230)],
    options: finish3(70, 140),
    features: ["بوكس ستارة مخفي مجانًا", "إضاءة قابلة للتخفيت", "عزل حراري إضافي اختياري"],
    badge: "خصم ١٠٪",
    sales: 201,
  },
  {
    slug: "gypsum-tv-unit-led",
    category: "walls",
    name: "وحدة تلفزيون جبس بورد مع إضاءة LED",
    shortDescription: "خلفية تلفزيون عصرية بنيشات وإضاءة مخفية.",
    description:
      "وحدة تلفزيون كاملة من الجبس بورد بتصميم مودرن: فتحات للأجهزة، نيشات للعرض، إضاءة LED خلفية وتمديدات مخفية للكابلات. تُنفَّذ بالمقاسات الدقيقة لجدارك وتُدهن بالألوان التي تختارها.",
    price: 1450,
    compareAtPrice: 1650,
    unit: "متر طولي",
    minQty: 2,
    step: 1,
    images: [px(6585766), px(7227625), px(7545494), px(6934171)],
    options: [
      { label: "تصميم بسيط", priceDelta: 0 },
      { label: "تصميم مع نيشات", priceDelta: 300 },
      { label: "تصميم فاخر مع رخام وإضاءة", priceDelta: 750 },
    ],
    optionsLabel: "نمط التصميم",
    features: [
      "مقاسات حسب الجدار",
      "تمديدات كابلات وكهرباء مخفية",
      "إضاءة LED خلفية",
      "تصميم ثلاثي الأبعاد قبل التنفيذ",
    ],
    badge: "الأكثر مبيعًا",
    featured: true,
    sales: 389,
    leadTime: "خلال ٥ - ١٠ أيام عمل",
  },
  {
    slug: "wpc-wooden-wall-panels",
    category: "walls",
    name: "ألواح حائط خشبية ديكور (WPC)",
    shortDescription: "دفء الخشب بلا صيانة ومقاوم للرطوبة والنمل.",
    description:
      "ألواح WPC مضلعة بلمسة خشب طبيعي تُثبَّت على إطار مخفي، تضفي دفئًا وعمقًا على الجدران وتتحمل الرطوبة والخدش. تتوفر بعدة ألوان: جوز، بلوط، رمادي فحمي وأبيض.",
    price: 650,
    unit: "م²",
    minQty: 5,
    step: 1,
    images: [px(6585766), px(6934239), px(8089161)],
    options: [
      { label: "بلوط فاتح", priceDelta: 0 },
      { label: "جوز داكن", priceDelta: 0 },
      { label: "رمادي فحمي", priceDelta: 30 },
      { label: "أبيض ثلجي", priceDelta: 30 },
    ],
    optionsLabel: "اللون",
    features: ["مقاوم للرطوبة والنمل", "تركيب نظيف وسريع", "لا يحتاج صيانة أو دهان"],
    badge: "جديد",
    featured: true,
    sales: 164,
  },
  {
    slug: "illuminated-gypsum-niches",
    category: "walls",
    name: "نيشات وأرفف جبس مضيئة",
    shortDescription: "نيشات عرض أنيقة بإضاءة مخفية لإبراز مقتنياتك.",
    description:
      "نيشات جبس بورد بأحجام وتقسيمات مختلفة مع إضاءة LED مخفية تبرز التحف واللوحات والكتب. تناسب الصالات وغرف الطعام والمداخل.",
    price: 750,
    unit: "متر طولي",
    minQty: 1,
    step: 1,
    images: [px(7227625), px(7166926), px(7227643)],
    options: finish3(120, 260),
    features: ["إضاءة LED لكل نيش", "تشطيب بدهان مطفي أو لامع", "تصميم يتناسب مع الأثاث"],
    sales: 98,
  },
  {
    slug: "3d-feature-wall",
    category: "walls",
    name: "جدار ديكور ثلاثي الأبعاد بارز",
    shortDescription: "جدار مميز بنقوش بارزة يصنع نقطة جذب فورية.",
    description:
      "جدار رئيسي بتصميم ثلاثي الأبعاد من الجبس بورد والجبس المصبوب، بخطوط عمودية أو موجات أو أشكال هندسية. مع الدهان المناسب والإضاءة الجانبية تتحول الجدران إلى لوحة فنية.",
    price: 590,
    compareAtPrice: 690,
    unit: "م²",
    minQty: 4,
    step: 1,
    images: [px(8089168), px(8089174), px(6394592)],
    options: finish3(90, 190),
    features: ["تصميمات حصرية", "دهان مخصص يبرز النقوش", "ضمان ٣ سنوات"],
    badge: "خصم ١٤٪",
    sales: 121,
  },
  {
    slug: "gold-classic-wall-panels",
    category: "walls",
    name: "بانوهات جدارية كلاسيك بإطارات مذهبة",
    shortDescription: "فخامة القصور الكلاسيكية لغرف الاستقبال والمجالس.",
    description:
      "بانوهات جبس بإطارات بارزة مع تشطيب ورق ذهب أو دهان ذهبي، تمنح مجالس الاستقبال وغرف الطعام أناقة كلاسيكية لا تتقادم. تُنفَّذ بدقة حرفية على يد فنيين متخصصين.",
    price: 890,
    unit: "م²",
    minQty: 5,
    step: 1,
    images: [px(8141956), px(8135119), px(6987730)],
    options: [
      { label: "دهان ذهبي", priceDelta: 0 },
      { label: "ورق ذهب ٢٢ قيراط", priceDelta: 420 },
    ],
    optionsLabel: "نوع التذهيب",
    features: ["حرفية عالية", "إطارات صب بتفاصيل دقيقة", "تصميم حسب الطلب"],
    sales: 64,
    leadTime: "خلال ١٠ - ١٥ يوم عمل",
  },
  {
    slug: "premium-plastic-paint",
    category: "paint",
    name: "دهان بلاستيك فاخر (مطفي / ساتان)",
    shortDescription: "ألوان ثابتة وغطاء ممتاز بثلاثة أوجه متقنة.",
    description:
      "دهان جدران وأسقف بأجود أنواع البلاستيك المائي من أشهر الماركات، بعد تجهيز السطح وتأسيسه. نستخدم رولات وفرش احترافية لنتيجة منتظمة بلا آثار، ونقدم لك كتالوج ألوان كامل ونسخ لون تجريبية قبل التنفيذ.",
    price: 65,
    unit: "م²",
    minQty: 30,
    step: 5,
    images: [px(7218683), px(36153946), px(7218009), px(7166945)],
    options: [
      { label: "بلاستيك قياسي", priceDelta: 0 },
      { label: "قابل للغسيل", priceDelta: 14 },
      { label: "ماركة فاخرة مضاد للبكتيريا", priceDelta: 28 },
    ],
    optionsLabel: "نوع الدهان",
    features: [
      "ثلاثة أوجه دهان متقنة",
      "تغطية الأرضيات والأثاث بالكامل",
      "كتالوج ألوان + عينة تجريبية",
      "ضمان الدهان ٣ سنوات",
    ],
    badge: "الأكثر مبيعًا",
    featured: true,
    sales: 530,
    leadTime: "خلال ٢ - ٥ أيام عمل",
  },
  {
    slug: "oil-paint-doors-wood",
    category: "paint",
    name: "دهان زيتي للأبواب والأخشاب",
    shortDescription: "تشطيب لامع أو نصف لامع يحمي الخشب ويجدده.",
    description:
      "تجديد الأبواب والشبابيك والأعمال الخشبية بدهان زيتي أو دوكو بعد الصنفرة والمعجون والتأسيس، لسطح أملس يقاوم الخدش والرطوبة وتتحمل ألوانه سنوات طويلة.",
    price: 110,
    unit: "م²",
    minQty: 10,
    step: 1,
    images: [px(7218579), px(6474462), px(6474135)],
    options: [
      { label: "زيتي لامع", priceDelta: 0 },
      { label: "دوكو أوتوموتيف", priceDelta: 65 },
    ],
    optionsLabel: "نوع الدهان",
    features: ["صنفرة وتأسيس كاملان", "مقاوم للخدش", "لمعة أو نصف لمعة"],
    sales: 112,
  },
  {
    slug: "venetian-stucco-finish",
    category: "paint",
    name: "دهان ديكوري استكو فينيسي",
    shortDescription: "ملمس رخامي فريد يمنح الجدار عمقًا ولمعة ناعمة.",
    description:
      "تقنية استكو فينيسي تُنفَّذ بطبقات رقيقة متتالية وتلميع يدوي لتحصل على ملمس شبيه بالرخام الطبيعي. تُستخدم في الجدار الرئيسي للصالة وغرف الاستقبال والمداخل. تتوفر بتدرجات الرمادي والبيج والذهبي.",
    price: 210,
    compareAtPrice: 250,
    unit: "م²",
    minQty: 6,
    step: 1,
    images: [px(8089161), px(7218001), px(8146200)],
    options: [
      { label: "بيج رملي", priceDelta: 0 },
      { label: "رمادي رخامي", priceDelta: 0 },
      { label: "ذهبي لؤلؤي", priceDelta: 40 },
    ],
    optionsLabel: "درجة اللون",
    features: ["تنفيذ يدوي بأيدي فنانين", "لمعة مخملية ناعمة", "قابل للتنظيف بسهولة"],
    badge: "خصم ١٦٪",
    featured: true,
    sales: 87,
  },
  {
    slug: "wall-prep-putty",
    category: "paint",
    name: "تجهيز الجدران: معجون وتأسيس وصنفرة",
    shortDescription: "الأساس المتين لأي دهان ناجح وخالٍ من العيوب.",
    description:
      "قبل أي لون يجب أن تكون الجدران مستوية: نزيل القديم المتقشر، نعالج الشروخ، ونضع معجون على ٣ أوجه مع صنفرة دقيقة وطبقة تأسيس (سيلر) تضمن ثبات الدهان وتمنع ظهور العيوب.",
    price: 45,
    unit: "م²",
    minQty: 30,
    step: 5,
    images: [px(6474208), px(8469943), px(7218001)],
    options: [
      { label: "معجون ٢ وجه", priceDelta: 0 },
      { label: "معجون ٣ أوجه", priceDelta: 12 },
    ],
    optionsLabel: "عدد الأوجه",
    features: ["معالجة الشروخ", "صنفرة دقيقة", "سيلر عازل للرطوبة"],
    sales: 244,
    leadTime: "خلال ٢ - ٤ أيام عمل",
  },
  {
    slug: "soundproof-gypsum-partition",
    category: "partitions",
    name: "فاصل جبس بورد عازل للصوت",
    shortDescription: "جدار خفيف سريع التركيب مع عزل صوتي ممتاز.",
    description:
      "فاصل بوجهين جبس بورد وصوف صخري عازل بين الوجهين بهيكل معدني، يخفض الضوضاء بدرجة كبيرة ويوفر المساحة مقارنة بالطوب. مناسب لتقسيم الغرف والمكاتب وعمل غرف إضافية سريعًا.",
    price: 330,
    unit: "م²",
    minQty: 6,
    step: 1,
    images: [px(11427405), px(11427094), px(5493670), px(6474123)],
    options: [
      { label: "عازل صوت ٣٥ ديسيبل", priceDelta: 0 },
      { label: "عازل صوت ٤٥ ديسيبل", priceDelta: 70 },
    ],
    optionsLabel: "درجة العزل",
    features: ["صوف صخري عازل", "تنفيذ سريع بدون مخلفات", "مناسب للأبواب والنوافذ"],
    featured: true,
    sales: 176,
  },
  {
    slug: "office-glass-gypsum-partition",
    category: "partitions",
    name: "تقسيمة مكتبية جبس وزجاج",
    shortDescription: "تقسيمات أنيقة للمكاتب والعيادات والمحال التجارية.",
    description:
      "تقسيمات مكاتب تجمع الجبس بورد والزجاج السكوريت بإطارات ألومنيوم ناعمة، تمنح الإضاءة الطبيعية وتحافظ على الخصوصية. تتضمن أبوابًا زجاجية أو خشبية حسب الطلب.",
    price: 540,
    unit: "م²",
    minQty: 6,
    step: 1,
    images: [px(8135119), px(36887532), px(6934239)],
    options: finish3(60, 140),
    features: ["زجاج سكوريت ٨ مم", "إطارات ألومنيوم", "أبواب بمقابض فاخرة"],
    sales: 54,
    leadTime: "خلال ٧ - ١٠ أيام عمل",
  },
  {
    slug: "room-refresh-package",
    category: "packages",
    name: "باقة تجديد غرفة: جبس + دهان",
    shortDescription: "سقف جبس بإضاءة مخفية ودهان كامل لغرفة حتى ٢٠ م².",
    description:
      "باقة متكاملة لتجديد غرفة واحدة حتى ٢٠ م²: سقف جبس بإضاءة كوف، تجهيز الجدران ومعجون، دهان بلاستيك ثلاثة أوجه، وتنظيف كامل بعد الانتهاء. تعمل بسعر مقطوع دون مفاجآت.",
    price: 14500,
    compareAtPrice: 17500,
    unit: "غرفة",
    minQty: 1,
    step: 1,
    images: [px(7166945), px(7218683), px(6980724)],
    options: [
      { label: "الباقة الأساسية", priceDelta: 0 },
      { label: "الباقة المميزة (+ كرانيش)", priceDelta: 2800 },
      { label: "الباقة الملكية (+ جدار 3D)", priceDelta: 6500 },
    ],
    optionsLabel: "الباقة",
    features: ["سعر مقطوع بدون مفاجآت", "تنظيف كامل بعد التنفيذ", "ضمان ٥ سنوات", "معاينة وتصميم مجاني"],
    badge: "وفّر ١٧٪",
    featured: true,
    sales: 148,
    leadTime: "خلال ٦ - ٩ أيام عمل",
  },
  {
    slug: "full-apartment-package",
    category: "packages",
    name: "باقة الشقة الكاملة - تسليم مفتاح",
    shortDescription: "أسقف ودهانات وديكورات لشقتك كاملة بإدارة مهندس مختص.",
    description:
      "ننفذ لك شقتك بالكامل: أسقف جبس في الغرف، وحدة تلفزيون، تجهيز ودهان كل الجدران والأبواب، وكرانيش للصالة. يشرف على المشروع مهندس مختص مع جدول زمني واضح وتقارير دورية، وتستلم شقتك جاهزة للسكن.",
    price: 410,
    unit: "م² من مساحة الشقة",
    minQty: 80,
    step: 5,
    images: [px(7545494), px(36153946), px(8146200), px(7148779)],
    options: [
      { label: "تشطيب اقتصادي", priceDelta: 0 },
      { label: "تشطيب سوبر لوكس", priceDelta: 120 },
      { label: "تشطيب ألترا لوكس", priceDelta: 260 },
    ],
    features: ["مهندس مشرف وجدول زمني", "تسليم مفتاح جاهز للسكن", "ضمان ٥ سنوات شامل", "دفعات مرنة على مراحل"],
    badge: "حصري",
    sales: 39,
    leadTime: "من ٢٥ إلى ٤٥ يوم عمل",
  },
];

/* ---------------- Reviews ---------------- */

const authors = [
  ["أحمد السيد", "القاهرة"],
  ["منى عبد الرحمن", "الجيزة"],
  ["محمود فتحي", "الإسكندرية"],
  ["سارة إبراهيم", "التجمع الخامس"],
  ["خالد عبد العزيز", "المنصورة"],
  ["هبة الله محمد", "٦ أكتوبر"],
  ["طارق حسين", "طنطا"],
  ["نهى سمير", "مدينة نصر"],
  ["عمرو جمال", "الزقازيق"],
  ["دينا يوسف", "الشيخ زايد"],
  ["ياسر مصطفى", "الإسماعيلية"],
  ["ريم الشريف", "المعادي"],
];

const reviewPool: { title: string; body: string; rating: number }[] = [
  {
    title: "شغل نضيف ومتقن",
    body: "الفريق التزم بالموعد بالضبط وسابوا المكان نظيف تمامًا. التشطيب ناعم والخطوط مظبوطة، وفعلاً الصورة النهائية أحلى من التصميم.",
    rating: 5,
  },
  {
    title: "تجربة ممتازة من البداية للنهاية",
    body: "المعاينة كانت مجانية والمهندس اقترح حلول ماكنتش في بالي. السعر واضح من غير مفاجآت ولا إضافات مخفية.",
    rating: 5,
  },
  {
    title: "جودة عالية وسعر مناسب",
    body: "قارنت بين أكتر من عرض وكان رشيد الأفضل من حيث الجودة مقابل السعر. الخامات أصلية والعمال محترفين.",
    rating: 5,
  },
  {
    title: "أنصح بيه بشدة",
    body: "تعاملت معاهم في شقتي الجديدة والنتيجة فاقت توقعاتي. الإضاءة والتصميم مدهشين والجيران كلهم سألوا عن رقمهم.",
    rating: 5,
  },
  {
    title: "ممتاز مع ملاحظة بسيطة",
    body: "الشغل جميل جدًا والتسليم قبل الميعاد بيوم. تأخروا ساعتين في أول يوم لكن عوضوه، وخدمة ما بعد التنفيذ محترمة.",
    rating: 4,
  },
  {
    title: "فرق كبير في المكان",
    body: "المكان اتغير تمامًا وبقى أوسع وأرقى. التزام بالمواصفات المتفق عليها وتعامل راقٍ من الفريق كله.",
    rating: 5,
  },
  {
    title: "رضيت عن التجربة",
    body: "التنفيذ كان سريع ومتقن، والمهندس رد على كل أسئلتي. خصمت نجمة بسبب إن اللون النهائي احتاج تعديل بسيط وتم بسرعة.",
    rating: 4,
  },
  {
    title: "صنايعية محترفين",
    body: "ملاحظ إن الفريق متمرس؛ قياسات دقيقة وتشطيب بلا عيوب. بالتأكيد هتعامل معاهم تاني في المرحلة التانية من الشقة.",
    rating: 5,
  },
  {
    title: "أفضل من المتوقع",
    body: "كنت متردد في البداية لكن بعد المعاينة والعينات اطمأنيت. النتيجة جميلة والأسعار منافسة جدًا.",
    rating: 4,
  },
  {
    title: "خدمة راقية",
    body: "من أول اتصال لحد التسليم والتعامل محترم. بيحرصوا على أدق التفاصيل ويشرحوا كل خطوة قبل التنفيذ.",
    rating: 5,
  },
];

export type SeedReview = {
  productSlug: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  daysAgo: number;
};

export function buildSeedReviews(): SeedReview[] {
  const out: SeedReview[] = [];
  seedProducts.forEach((p, pi) => {
    const count = p.sales > 300 ? 6 : p.sales > 120 ? 5 : p.sales > 60 ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const r = reviewPool[(pi * 3 + i * 2) % reviewPool.length];
      const [author, city] = authors[(pi * 5 + i * 7) % authors.length];
      out.push({
        productSlug: p.slug,
        author,
        city,
        rating: r.rating,
        title: r.title,
        body: r.body,
        verified: i % 4 !== 3,
        daysAgo: 4 + ((pi * 11 + i * 17) % 160),
      });
    }
  });
  return out;
}
