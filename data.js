// China Transit Visa-Free Policy Data
// Based on the 144-hour / 72-hour / 24-hour visa-free transit policies

// 54 countries eligible for 144/72-hour visa-free transit
const ELIGIBLE_COUNTRIES_144 = [
  // Europe (39)
  "Austria", "Belgium", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Iceland", "Italy", "Latvia",
  "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal",
  "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Russia",
  "United Kingdom", "Ireland", "Cyprus", "Bulgaria", "Romania", "Ukraine",
  "Serbia", "Croatia", "Bosnia and Herzegovina", "Montenegro",
  "North Macedonia", "Albania", "Monaco", "Belarus",
  // Americas (6)
  "United States", "Canada", "Brazil", "Mexico", "Argentina", "Chile",
  // Oceania (2)
  "Australia", "New Zealand",
  // Asia (6)
  "South Korea", "Japan", "Singapore", "Brunei", "UAE", "Qatar"
];

// Additional countries eligible only for 24-hour transit (all nationalities
// are eligible for 24-hour transit at any international port, but these
// countries get the formal 24-hour policy at designated ports)
// In practice, 24-hour direct transit is available to almost all nationalities.

// ============================================================
// Port data organized by zone (省/region)
// Each zone specifies which ports qualify for which duration.
// ============================================================

// "zone" defines the geographic area a traveler can stay within.
// Ports within the same zone share the same allowed-stay region.

const TRANSIT_ZONES = {
  // ------- 144-hour zones -------
  "shanghai-jiangsu-zhejiang": {
    label: "Shanghai / Jiangsu / Zhejiang",
    duration: 144,
    stayArea: "Shanghai, Jiangsu province, and Zhejiang province",
    ports: {
      air: [
        { code: "PVG", name: "Shanghai Pudong International Airport" },
        { code: "SHA", name: "Shanghai Hongqiao International Airport" },
        { code: "NKG", name: "Nanjing Lukou International Airport" },
        { code: "HGH", name: "Hangzhou Xiaoshan International Airport" },
        { code: "NGB", name: "Ningbo Lishe International Airport" }
      ],
      rail: [
        { code: "SHA-RAIL", name: "Shanghai rail ports" },
        { code: "NKG-RAIL", name: "Nanjing rail port" },
      ],
      sea: [
        { code: "SHA-SEA", name: "Shanghai Port (cruise / sea)" },
        { code: "NBO-SEA", name: "Ningbo sea port" }
      ],
      land: []
    }
  },
  "beijing-tianjin-hebei": {
    label: "Beijing / Tianjin / Hebei",
    duration: 144,
    stayArea: "Beijing, Tianjin, and Hebei province",
    ports: {
      air: [
        { code: "PEK", name: "Beijing Capital International Airport" },
        { code: "PKX", name: "Beijing Daxing International Airport" },
        { code: "TSN", name: "Tianjin Binhai International Airport" },
        { code: "SJW", name: "Shijiazhuang Zhengding International Airport" }
      ],
      rail: [
        { code: "BJ-RAIL", name: "Beijing rail ports" },
        { code: "TSN-RAIL", name: "Tianjin rail port" }
      ],
      sea: [
        { code: "TSN-SEA", name: "Tianjin sea port" },
        { code: "QHD-SEA", name: "Qinhuangdao sea port" }
      ],
      land: []
    }
  },
  "guangdong": {
    label: "Guangdong",
    duration: 144,
    stayArea: "Guangdong province",
    ports: {
      air: [
        { code: "CAN", name: "Guangzhou Baiyun International Airport" },
        { code: "SZX", name: "Shenzhen Bao'an International Airport" },
        { code: "ZUH", name: "Zhuhai Jinwan Airport" }
      ],
      rail: [
        { code: "GZ-RAIL", name: "Guangzhou rail port" },
        { code: "SZ-RAIL", name: "Shenzhen rail port" }
      ],
      sea: [
        { code: "GZ-SEA", name: "Nansha sea port" },
        { code: "SZ-SEA", name: "Shekou / Shenzhen sea port" }
      ],
      land: [
        { code: "SZ-LAND", name: "Shenzhen land ports (Luohu, Futian, Huanggang, etc.)" },
        { code: "ZH-LAND", name: "Zhuhai Gongbei / Hengqin land port" }
      ]
    }
  },
  "chengdu": {
    label: "Chengdu",
    duration: 144,
    stayArea: "Chengdu, plus 11 cities in Sichuan, Chongqing, Shaanxi, etc.",
    ports: {
      air: [
        { code: "CTU", name: "Chengdu Shuangliu International Airport" },
        { code: "TFU", name: "Chengdu Tianfu International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "chongqing": {
    label: "Chongqing",
    duration: 144,
    stayArea: "Chongqing municipality",
    ports: {
      air: [
        { code: "CKG", name: "Chongqing Jiangbei International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "xiamen": {
    label: "Xiamen (Fujian)",
    duration: 144,
    stayArea: "Xiamen and Fujian province",
    ports: {
      air: [
        { code: "XMN", name: "Xiamen Gaoqi International Airport" }
      ],
      rail: [],
      sea: [
        { code: "XMN-SEA", name: "Xiamen sea port" }
      ],
      land: []
    }
  },
  "qingdao": {
    label: "Qingdao (Shandong)",
    duration: 144,
    stayArea: "Qingdao and Shandong province",
    ports: {
      air: [
        { code: "TAO", name: "Qingdao Jiaodong International Airport" }
      ],
      rail: [],
      sea: [
        { code: "TAO-SEA", name: "Qingdao sea port" }
      ],
      land: []
    }
  },
  "wuhan": {
    label: "Wuhan (Hubei)",
    duration: 144,
    stayArea: "Wuhan and Hubei province",
    ports: {
      air: [
        { code: "WUH", name: "Wuhan Tianhe International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "kunming": {
    label: "Kunming (Yunnan)",
    duration: 144,
    stayArea: "Kunming, and selected areas in Yunnan",
    ports: {
      air: [
        { code: "KMG", name: "Kunming Changshui International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "xian": {
    label: "Xi'an (Shaanxi)",
    duration: 144,
    stayArea: "Xi'an and Shaanxi province",
    ports: {
      air: [
        { code: "XIY", name: "Xi'an Xianyang International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "harbin": {
    label: "Harbin (Heilongjiang)",
    duration: 144,
    stayArea: "Harbin and Heilongjiang province",
    ports: {
      air: [
        { code: "HRB", name: "Harbin Taiping International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "dalian-shenyang": {
    label: "Dalian / Shenyang (Liaoning)",
    duration: 144,
    stayArea: "Liaoning province",
    ports: {
      air: [
        { code: "DLC", name: "Dalian Zhoushuizi International Airport" },
        { code: "SHE", name: "Shenyang Taoxian International Airport" }
      ],
      rail: [],
      sea: [
        { code: "DLC-SEA", name: "Dalian sea port" }
      ],
      land: []
    }
  },
  "guilin": {
    label: "Guilin (Guangxi)",
    duration: 144,
    stayArea: "Guilin city",
    ports: {
      air: [
        { code: "KWL", name: "Guilin Liangjiang International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "changsha": {
    label: "Changsha (Hunan)",
    duration: 144,
    stayArea: "Changsha and Hunan province",
    ports: {
      air: [
        { code: "CSX", name: "Changsha Huanghua International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },

  // ------- 72-hour zones -------
  "haikou-sanya": {
    label: "Haikou / Sanya (Hainan)",
    duration: 72,
    stayArea: "Hainan province",
    note: "Hainan also has a separate 30-day visa-free policy for 59 countries.",
    ports: {
      air: [
        { code: "HAK", name: "Haikou Meilan International Airport" },
        { code: "SYX", name: "Sanya Phoenix International Airport" }
      ],
      rail: [],
      sea: [
        { code: "HAK-SEA", name: "Haikou sea port" },
        { code: "SYX-SEA", name: "Sanya sea port" }
      ],
      land: []
    }
  },
  "nanning": {
    label: "Nanning (Guangxi)",
    duration: 72,
    stayArea: "Nanning city area",
    ports: {
      air: [
        { code: "NNG", name: "Nanning Wuxu International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  },
  "zhengzhou": {
    label: "Zhengzhou (Henan)",
    duration: 72,
    stayArea: "Zhengzhou and Henan province",
    ports: {
      air: [
        { code: "CGO", name: "Zhengzhou Xinzheng International Airport" }
      ],
      rail: [],
      sea: [],
      land: []
    }
  }
};

// All countries for the destination dropdown
const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile",
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Ecuador", "Egypt", "Estonia",
  "Ethiopia", "Fiji", "Finland", "France", "Georgia",
  "Germany", "Ghana", "Greece", "Guatemala", "Honduras",
  "Hong Kong", "Hungary", "Iceland", "India", "Indonesia",
  "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Libya", "Lithuania", "Luxembourg", "Macau", "Madagascar",
  "Malaysia", "Maldives", "Mali", "Malta", "Mexico",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Saudi Arabia", "Senegal", "Serbia",
  "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Tunisia", "Turkey", "Turkmenistan", "UAE",
  "Uganda", "Ukraine", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];
