// ============================================================
// China visa-free policy data
//
// Source of truth: National Immigration Administration (NIA)
//   https://en.nia.gov.cn/n147418/n147463/c183412/content.html
//
// Policy last reviewed: 2026-09-26
//
// The 72-hour and 144-hour transit policies were superseded on
// 2024-12-17 by a single 240-hour (10-day) visa-free transit policy.
// Two rules changed in ways that matter for this tool:
//   1. Entry and exit no longer have to be in the same region.
//   2. Travellers may cross provincial boundaries within the
//      permitted stay areas.
// ============================================================

const POLICY = {
  transitHours: 240,
  reviewedOn: "2026-09-26",
  effectiveFrom: "17 December 2024",
  officialPortCount: 65,
  regionCount: 24,
  sourceUrl: "https://en.nia.gov.cn/n147418/n147463/c183412/content.html"
};

// ------------------------------------------------------------
// Nationalities eligible for 240-hour visa-free transit (57)
// ------------------------------------------------------------
const TRANSIT_COUNTRIES = [
  // Europe (40)
  "Albania", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
  "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia",
  "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland",
  "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Monaco",
  "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland",
  "Portugal", "Romania", "Russia", "Serbia", "Slovakia", "Slovenia", "Spain",
  "Sweden", "Switzerland", "Ukraine", "United Kingdom",
  // Americas (6)
  "Argentina", "Brazil", "Canada", "Chile", "Mexico", "United States",
  // Asia (9)
  "Brunei", "Indonesia", "Japan", "Kyrgyzstan", "Qatar", "Singapore",
  "South Korea", "UAE", "Vietnam",
  // Oceania (2)
  "Australia", "New Zealand"
];

// Nationalities added after the 2024-12-17 launch, so the result can
// mention how recent their eligibility is.
const TRANSIT_COUNTRY_ADDED = {
  "Indonesia": "12 June 2025",
  "Kyrgyzstan": "20 August 2026",
  "Vietnam": "20 August 2026"
};

// ------------------------------------------------------------
// Unilateral 30-day visa-free entry (no transit conditions at all).
// Anyone on this list can skip the transit rules entirely, so the
// checker surfaces it before anything else.
// Most entries run to 31 December 2026; verify before travel.
// ------------------------------------------------------------
const VISA_FREE_30_DAY = [
  "Andorra", "Argentina", "Australia", "Austria", "Bahrain", "Belgium", "Brazil",
  "Brunei", "Bulgaria", "Canada", "Chile", "Croatia", "Cyprus", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland",
  "Ireland", "Italy", "Japan", "Kuwait", "Latvia", "Liechtenstein",
  "Luxembourg", "Malta", "Monaco", "Montenegro", "Netherlands",
  "New Zealand", "North Macedonia", "Norway", "Oman", "Peru", "Poland", "Portugal",
  "Romania", "Russia", "Saudi Arabia", "Slovakia", "Slovenia", "South Korea",
  "Spain", "Sweden", "Switzerland", "United Kingdom", "Uruguay"
];

// ------------------------------------------------------------
// Mutual (bilateral) visa exemption agreements. Also no transit
// conditions, but each agreement sets its own terms: most allow
// up to 30 days per visit, some cap total days per 180.
// Kept disjoint from VISA_FREE_30_DAY (the tests enforce it).
// ------------------------------------------------------------
const MUTUAL_VISA_EXEMPT = [
  "Albania", "Antigua and Barbuda", "Armenia", "Bahamas", "Barbados",
  "Belarus", "Bosnia and Herzegovina", "Dominica", "Ecuador", "Fiji",
  "Georgia", "Grenada", "Kazakhstan", "Malaysia", "Maldives", "Mauritius",
  "Qatar", "Samoa", "San Marino", "Serbia", "Seychelles", "Singapore",
  "Solomon Islands", "Suriname", "Thailand", "Tonga", "UAE", "Uzbekistan"
];

// ------------------------------------------------------------
// Permitted stay areas: 24 provinces, autonomous regions and
// municipalities. Travel between any of these is allowed.
// `scope` is "all" for province-wide access, or a list of cities.
// ------------------------------------------------------------
const STAY_REGIONS = [
  { name: "Beijing", scope: "all" },
  { name: "Tianjin", scope: "all" },
  { name: "Hebei", scope: "all" },
  { name: "Shanxi", scope: ["Taiyuan", "Datong"] },
  { name: "Liaoning", scope: "all" },
  { name: "Heilongjiang", scope: ["Harbin"] },
  { name: "Shanghai", scope: "all" },
  { name: "Jiangsu", scope: "all" },
  { name: "Zhejiang", scope: "all" },
  { name: "Anhui", scope: "all" },
  { name: "Fujian", scope: "all" },
  { name: "Jiangxi", scope: ["Nanchang", "Jingdezhen"] },
  { name: "Shandong", scope: "all" },
  { name: "Henan", scope: "all" },
  { name: "Hubei", scope: "all" },
  { name: "Hunan", scope: "all" },
  { name: "Guangdong", scope: "all" },
  { name: "Guangxi", scope: ["Nanning", "Liuzhou", "Guilin", "Wuzhou", "Beihai",
    "Fangchenggang", "Qinzhou", "Guigang", "Yulin", "Hezhou", "Hechi", "Laibin"] },
  { name: "Hainan", scope: "all" },
  { name: "Chongqing", scope: "all" },
  { name: "Sichuan", scope: "all" },
  { name: "Guizhou", scope: "all" },
  { name: "Yunnan", scope: ["Kunming", "Yuxi", "Chuxiong", "Honghe", "Wenshan",
    "Pu'er", "Xishuangbanna", "Dali", "Lijiang"] },
  { name: "Shaanxi", scope: "all" }
];

// Regions explicitly NOT covered by the policy.
const EXCLUDED_REGIONS = [
  "Jilin", "Inner Mongolia", "Gansu", "Qinghai", "Ningxia", "Xinjiang", "Tibet"
];

// ------------------------------------------------------------
// Designated ports, grouped by province.
//
// The NIA designates 65 ports. This list tracks them but groups a
// few differently (individual rail stations, clustered land ports),
// so the entry count here will not match 65 exactly. The list also
// changes fairly often, so a port missing here is reported as
// "unconfirmed", never as "not eligible".
// ------------------------------------------------------------
const PORTS = [
  { region: "Beijing", ports: [
    { name: "Beijing Capital International Airport", code: "PEK", method: "air" },
    { name: "Beijing Daxing International Airport", code: "PKX", method: "air" }
  ]},
  { region: "Tianjin", ports: [
    { name: "Tianjin Binhai International Airport", code: "TSN", method: "air" },
    { name: "Tianjin Port (passenger)", code: "TSN-SEA", method: "sea" }
  ]},
  { region: "Hebei", ports: [
    { name: "Shijiazhuang Zhengding International Airport", code: "SJW", method: "air" },
    { name: "Qinhuangdao Port (passenger)", code: "QHD-SEA", method: "sea" }
  ]},
  { region: "Shanxi", ports: [
    { name: "Taiyuan Wusu International Airport", code: "TYN", method: "air" }
  ]},
  { region: "Liaoning", ports: [
    { name: "Shenyang Taoxian International Airport", code: "SHE", method: "air" },
    { name: "Dalian Zhoushuizi International Airport", code: "DLC", method: "air" },
    { name: "Dalian Port (passenger)", code: "DLC-SEA", method: "sea" }
  ]},
  { region: "Heilongjiang", ports: [
    { name: "Harbin Taiping International Airport", code: "HRB", method: "air" }
  ]},
  { region: "Shanghai", ports: [
    { name: "Shanghai Pudong International Airport", code: "PVG", method: "air" },
    { name: "Shanghai Hongqiao International Airport", code: "SHA", method: "air" },
    { name: "Shanghai Port International Cruise Terminal", code: "SHA-SEA", method: "sea" },
    { name: "Shanghai Railway Station", code: "SHA-RAIL", method: "rail" }
  ]},
  { region: "Jiangsu", ports: [
    { name: "Nanjing Lukou International Airport", code: "NKG", method: "air" },
    { name: "Sunan Shuofang International Airport (Wuxi)", code: "WUX", method: "air" },
    { name: "Yangzhou Taizhou International Airport", code: "YTY", method: "air" },
    { name: "Lianyungang Port (passenger)", code: "LYG-SEA", method: "sea" }
  ]},
  { region: "Zhejiang", ports: [
    { name: "Hangzhou Xiaoshan International Airport", code: "HGH", method: "air" },
    { name: "Ningbo Lishe International Airport", code: "NGB", method: "air" },
    { name: "Wenzhou Longwan International Airport", code: "WNZ", method: "air" },
    { name: "Ningbo Port (passenger)", code: "NGB-SEA", method: "sea" }
  ]},
  { region: "Anhui", ports: [
    { name: "Hefei Xinqiao International Airport", code: "HFE", method: "air" },
    { name: "Huangshan Tunxi International Airport", code: "TXN", method: "air" }
  ]},
  { region: "Fujian", ports: [
    { name: "Xiamen Gaoqi International Airport", code: "XMN", method: "air" },
    { name: "Fuzhou Changle International Airport", code: "FOC", method: "air" },
    { name: "Quanzhou Jinjiang International Airport", code: "JJN", method: "air" },
    { name: "Xiamen Port (passenger)", code: "XMN-SEA", method: "sea" }
  ]},
  { region: "Jiangxi", ports: [
    { name: "Nanchang Changbei International Airport", code: "KHN", method: "air" }
  ]},
  { region: "Shandong", ports: [
    { name: "Qingdao Jiaodong International Airport", code: "TAO", method: "air" },
    { name: "Jinan Yaoqiang International Airport", code: "TNA", method: "air" },
    { name: "Yantai Penglai International Airport", code: "YNT", method: "air" },
    { name: "Qingdao Port (passenger)", code: "TAO-SEA", method: "sea" },
    { name: "Yantai Port (passenger)", code: "YNT-SEA", method: "sea" },
    { name: "Weihai Port (passenger)", code: "WEH-SEA", method: "sea" }
  ]},
  { region: "Henan", ports: [
    { name: "Zhengzhou Xinzheng International Airport", code: "CGO", method: "air" }
  ]},
  { region: "Hubei", ports: [
    { name: "Wuhan Tianhe International Airport", code: "WUH", method: "air" }
  ]},
  { region: "Hunan", ports: [
    { name: "Changsha Huanghua International Airport", code: "CSX", method: "air" },
    { name: "Zhangjiajie Hehua International Airport", code: "DYG", method: "air" }
  ]},
  { region: "Guangdong", ports: [
    { name: "Guangzhou Baiyun International Airport", code: "CAN", method: "air" },
    { name: "Shenzhen Bao'an International Airport", code: "SZX", method: "air" },
    { name: "Jieyang Chaoshan International Airport", code: "SWA", method: "air" },
    { name: "Meizhou Meixian Airport", code: "MXZ", method: "air" },
    { name: "Zhanjiang Wuchuan Airport", code: "ZHA", method: "air" },
    { name: "Guangzhou Tianhe Railway Station", code: "GZ-RAIL", method: "rail" },
    { name: "Dongguan Railway Station", code: "DG-RAIL", method: "rail" },
    { name: "Foshan Railway Station", code: "FS-RAIL", method: "rail" },
    { name: "Zhaoqing Railway Station", code: "ZQ-RAIL", method: "rail" },
    { name: "Hong Kong West Kowloon Station", code: "WKS-RAIL", method: "rail" },
    { name: "Shenzhen land ports (Luohu, Futian, Huanggang)", code: "SZ-LAND", method: "land" },
    { name: "Zhuhai Gongbei Port", code: "ZH-LAND", method: "land" },
    { name: "Hengqin Port", code: "HQ-LAND", method: "land" },
    { name: "Hong Kong-Zhuhai-Macao Bridge Port", code: "HZMB-LAND", method: "land" },
    { name: "Shekou Port (passenger)", code: "SZ-SEA", method: "sea" },
    { name: "Nansha Port (passenger)", code: "NS-SEA", method: "sea" },
    { name: "Guangzhou Pazhou Passenger Port", code: "PZ-SEA", method: "sea" },
    { name: "Zhongshan Port (passenger)", code: "ZS-SEA", method: "sea" }
  ]},
  { region: "Guangxi", ports: [
    { name: "Nanning Wuxu International Airport", code: "NNG", method: "air" },
    { name: "Guilin Liangjiang International Airport", code: "KWL", method: "air" },
    { name: "Beihai Fucheng Airport", code: "BHY", method: "air" },
    { name: "Beihai Port (passenger)", code: "BHY-SEA", method: "sea" }
  ]},
  { region: "Hainan", ports: [
    { name: "Haikou Meilan International Airport", code: "HAK", method: "air" },
    { name: "Sanya Phoenix International Airport", code: "SYX", method: "air" },
    { name: "Haikou Port (passenger)", code: "HAK-SEA", method: "sea" },
    { name: "Sanya Port (passenger)", code: "SYX-SEA", method: "sea" }
  ]},
  { region: "Chongqing", ports: [
    { name: "Chongqing Jiangbei International Airport", code: "CKG", method: "air" }
  ]},
  { region: "Sichuan", ports: [
    { name: "Chengdu Shuangliu International Airport", code: "CTU", method: "air" },
    { name: "Chengdu Tianfu International Airport", code: "TFU", method: "air" }
  ]},
  { region: "Guizhou", ports: [
    { name: "Guiyang Longdongbao International Airport", code: "KWE", method: "air" }
  ]},
  { region: "Yunnan", ports: [
    { name: "Kunming Changshui International Airport", code: "KMG", method: "air" },
    { name: "Lijiang Sanyi International Airport", code: "LJG", method: "air" },
    { name: "Xishuangbanna Gasa International Airport", code: "JHG", method: "air" }
  ]},
  { region: "Shaanxi", ports: [
    { name: "Xi'an Xianyang International Airport", code: "XIY", method: "air" }
  ]}
];

// What you must be able to show at the border.
const TRANSIT_REQUIREMENTS = [
  "An ordinary passport valid for at least 3 more months",
  "A confirmed onward ticket to a third country or region, departing within 240 hours",
  "An arrival card, filled in on arrival",
  "The address where you will be staying"
];

// ------------------------------------------------------------
// Countries and regions outside mainland China. Used for both
// ends of the journey: where you arrive from and where you go
// on to. Hong Kong, Macao and Taiwan count as third regions for
// transit purposes; mainland China does not.
// ------------------------------------------------------------
const DESTINATIONS = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
  "Belgium", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile",
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Dominica", "Ecuador", "Egypt", "Estonia", "Ethiopia", "Fiji",
  "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Honduras", "Hong Kong", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Macao", "Madagascar", "Malaysia", "Maldives", "Mali", "Malta",
  "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Samoa",
  "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "South Africa",
  "South Korea", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Tonga", "Tunisia", "Turkey", "Turkmenistan", "UAE",
  "Uganda", "Ukraine", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Passport dropdown needs every nationality the tool knows about.
const ALL_COUNTRIES = [...new Set([
  ...DESTINATIONS, ...TRANSIT_COUNTRIES, ...VISA_FREE_30_DAY, ...MUTUAL_VISA_EXEMPT
])].filter((c) => c !== "Hong Kong" && c !== "Macao" && c !== "Taiwan").sort();
