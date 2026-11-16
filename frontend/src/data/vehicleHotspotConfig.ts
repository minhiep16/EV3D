import { VehiclePartId } from '../types/vehiclePart';
import { VehicleResponse } from '../types/vehicle';

/**
 * Default automatic rotation interval between holographic text items (2000ms).
 * Measured strictly between content transitions so typewriter reveal never drifts the schedule.
 */
export const DEFAULT_ROTATION_INTERVAL_MS = 2000;

/**
 * Character reveal interval (~18ms/char) so a 35-45 char line completes in ~650-800ms,
 * fitting comfortably inside the 2000ms content window.
 */
export const DEFAULT_TYPEWRITER_CHAR_MS = 18;

export type HotspotAnchorSide = 'left' | 'right' | 'top';

export type HotspotIconKey =
  | 'disc'
  | 'sun'
  | 'shield'
  | 'layers'
  | 'eye'
  | 'key'
  | 'battery'
  | 'zap'
  | 'sparkles'
  | 'compass';

export interface HotspotInfoFrame {
  /** Category label (e.g. "Chất liệu", "Chức năng", "Đặc điểm", "Vai trò") */
  label: string;
  /** Concise content value (e.g. "Mâm hợp kim nhôm & lốp không săm") */
  value: string;
  /** Combined display string (e.g. "Chất liệu: Mâm hợp kim nhôm & lốp không săm") */
  text: string;
}

export interface VehicleHotspotItem {
  /** Unique part ID mapped to VehiclePartId for synchronized camera focus & selection */
  id: VehiclePartId;
  /** Primary display title (e.g., "Bánh xe / Lốp") */
  title: string;
  /** Short technical subtitle (e.g., "Mâm hợp kim nhôm & Lốp không săm") */
  subtitle?: string;
  /** Concise 1-line summary */
  shortDescription: string;
  /** Material / construction line ("Chất liệu") */
  material: string;
  /** Primary role / purpose line ("Chức năng") */
  function: string;
  /** Key advantage / highlight line ("Đặc điểm") */
  highlight: string;
  /** Additional role / operational benefit ("Vai trò") */
  roleSummary?: string;
  /** Ordered sequence of concise holographic text frames rotated every 2000ms */
  infoFrames: HotspotInfoFrame[];
  /** 3D position in vehicle-local space [x, y, z] attached to the vehicle turntable */
  position: [number, number, number];
  /** 3D offset from the hotspot to the floating 3D callout card [dx, dy, dz] */
  calloutOffset: [number, number, number];
  /** Preferred side alignment for connector line & callout */
  anchorSide: HotspotAnchorSide;
  /** Icon identifier rendered inside the hotspot marker & callout header */
  icon: HotspotIconKey;
}

function buildInfoFrames(
  material: string,
  func: string,
  highlight: string,
  roleSummary: string
): HotspotInfoFrame[] {
  return [
    {
      label: 'Chất liệu',
      value: material,
      text: `Chất liệu: ${material}`,
    },
    {
      label: 'Chức năng',
      value: func,
      text: `Chức năng: ${func}`,
    },
    {
      label: 'Đặc điểm',
      value: highlight,
      text: `Đặc điểm: ${highlight}`,
    },
    {
      label: 'Vai trò',
      value: roleSummary,
      text: `Vai trò: ${roleSummary}`,
    },
  ];
}

/**
 * Default 10-point EV 3D Hotspot Inspection Set (Standard EV01 / SUV / Crossover geometry)
 * All strings are authored concisely so the typewriter reveal finishes well inside the 2000ms window.
 */
export const DEFAULT_EV_HOTSPOTS: VehicleHotspotItem[] = [
  {
    id: 'WHEEL_FL',
    title: 'Bánh xe / Lốp',
    subtitle: 'Mâm hợp kim nhôm & Lốp không săm',
    shortDescription: 'Cụm bánh xe hợp kim khí động học kết hợp lốp không săm chuyên dụng.',
    material: 'Mâm hợp kim nhôm & lốp không săm',
    function: 'Hỗ trợ xe vận hành ổn định',
    highlight: 'Thiết kế khí động học nhẹ và bền',
    roleSummary: 'Tăng độ bám đường và chịu tải pin',
    infoFrames: buildInfoFrames(
      'Mâm hợp kim nhôm & lốp không săm',
      'Hỗ trợ xe vận hành ổn định',
      'Thiết kế khí động học nhẹ và bền',
      'Tăng độ bám đường và chịu tải pin'
    ),
    position: [-0.86, 0.36, 1.34],
    calloutOffset: [-0.95, 0.58, 0.35],
    anchorSide: 'left',
    icon: 'disc',
  },
  {
    id: 'HEADLIGHTS',
    title: 'Đèn pha',
    subtitle: 'Công nghệ chiếu sáng LED thông minh',
    shortDescription: 'Cụm đèn trước định hình diện mạo hiện đại và tối ưu tầm nhìn.',
    material: 'Thấu kính quang học & chip LED',
    function: 'Chiếu sáng mặt đường và nhận diện xe',
    highlight: 'Tiết kiệm điện năng, độ sáng cao',
    roleSummary: 'Tăng an toàn khi di chuyển ban đêm',
    infoFrames: buildInfoFrames(
      'Thấu kính quang học & chip LED',
      'Chiếu sáng mặt đường và nhận diện xe',
      'Tiết kiệm điện năng, độ sáng cao',
      'Tăng an toàn khi di chuyển ban đêm'
    ),
    position: [0.66, 0.74, 1.88],
    calloutOffset: [0.75, 0.62, 0.55],
    anchorSide: 'right',
    icon: 'sun',
  },
  {
    id: 'WINDSHIELD',
    title: 'Kính chắn gió',
    subtitle: 'Kính an toàn nhiều lớp cách âm',
    shortDescription: 'Kính lái toàn cảnh diện tích lớn bảo vệ khoang hành khách.',
    material: 'Kính an toàn nhiều lớp cách âm',
    function: 'Che chắn gió bụi và giảm tiếng ồn',
    highlight: 'Chịu lực cao, chống tia UV hiệu quả',
    roleSummary: 'Bảo vệ khoang lái và mở rộng tầm nhìn',
    infoFrames: buildInfoFrames(
      'Kính an toàn nhiều lớp cách âm',
      'Che chắn gió bụi và giảm tiếng ồn',
      'Chịu lực cao, chống tia UV hiệu quả',
      'Bảo vệ khoang lái và mở rộng tầm nhìn'
    ),
    position: [0.22, 1.22, 0.62],
    calloutOffset: [0.85, 0.62, 0.25],
    anchorSide: 'top',
    icon: 'shield',
  },
  {
    id: 'BODY',
    title: 'Thân vỏ',
    subtitle: 'Khung vỏ thép cường lực & hợp kim',
    shortDescription: 'Cấu trúc thân vỏ khí động học liền khối bảo vệ khoang xe.',
    material: 'Thép cường lực kết hợp hợp kim nhôm',
    function: 'Bảo vệ khung xe và khoang hành khách',
    highlight: 'Độ cứng xoắn cao, hấp thụ xung lực',
    roleSummary: 'Tăng độ cứng vững và an toàn vận hành',
    infoFrames: buildInfoFrames(
      'Thép cường lực kết hợp hợp kim nhôm',
      'Bảo vệ khung xe và khoang hành khách',
      'Độ cứng xoắn cao, hấp thụ xung lực',
      'Tăng độ cứng vững và an toàn vận hành'
    ),
    position: [0.90, 0.78, -0.52],
    calloutOffset: [1.05, 0.52, 0.0],
    anchorSide: 'right',
    icon: 'layers',
  },
  {
    id: 'SIDE_MIRROR',
    title: 'Gương chiếu hậu',
    subtitle: 'Gương chỉnh điện tối ưu khí động học',
    shortDescription: 'Gương chiếu hậu ngoài tích hợp đèn báo rẽ LED hiện đại.',
    material: 'Vỏ nhựa ABS cao cấp & mặt gương chống chói',
    function: 'Quan sát giao thông phía sau và hai bên',
    highlight: 'Hỗ trợ chỉnh điện và gập gọn tiện lợi',
    roleSummary: 'Tối ưu khí động học và giảm điểm mù',
    infoFrames: buildInfoFrames(
      'Vỏ nhựa ABS cao cấp & mặt gương chống chói',
      'Quan sát giao thông phía sau và hai bên',
      'Hỗ trợ chỉnh điện và gập gọn tiện lợi',
      'Tối ưu khí động học và giảm điểm mù'
    ),
    position: [-0.96, 1.02, 0.68],
    calloutOffset: [-0.95, 0.58, 0.20],
    anchorSide: 'left',
    icon: 'eye',
  },
  {
    id: 'DOOR_HANDLE',
    title: 'Tay nắm cửa',
    subtitle: 'Thiết kế hiện đại mở khóa một chạm',
    shortDescription: 'Cụm tay nắm cửa đồng bộ hệ thống khóa thông minh.',
    material: 'Nhựa kỹ thuật ABS & hợp kim mạ satin',
    function: 'Đóng mở cửa xe nhẹ nhàng, thuận tiện',
    highlight: 'Thiết kế hiện đại liền mạch thân xe',
    roleSummary: 'Mở cửa nhanh và tăng thẩm mỹ ngoại thất',
    infoFrames: buildInfoFrames(
      'Nhựa kỹ thuật ABS & hợp kim mạ satin',
      'Đóng mở cửa xe nhẹ nhàng, thuận tiện',
      'Thiết kế hiện đại liền mạch thân xe',
      'Mở cửa nhanh và tăng thẩm mỹ ngoại thất'
    ),
    position: [-0.92, 0.86, 0.04],
    calloutOffset: [-1.0, 0.50, -0.15],
    anchorSide: 'left',
    icon: 'key',
  },
  {
    id: 'BATTERY',
    title: 'Bộ pin',
    subtitle: 'Hệ thống Pin Lithium-ion sàn xe',
    shortDescription: 'Khối pin năng lượng cao áp đặt phẳng dưới sàn xe.',
    material: 'Tổ hợp pin Lithium-ion khung bảo vệ kín',
    function: 'Cung cấp năng lượng cho hệ truyền động',
    highlight: 'Dung lượng cao, bố trí phẳng dưới sàn',
    roleSummary: 'Hạ thấp trọng tâm và ổn định thân xe',
    infoFrames: buildInfoFrames(
      'Tổ hợp pin Lithium-ion khung bảo vệ kín',
      'Cung cấp năng lượng cho hệ truyền động',
      'Dung lượng cao, bố trí phẳng dưới sàn',
      'Hạ thấp trọng tâm và ổn định thân xe'
    ),
    position: [-0.86, 0.22, -0.28],
    calloutOffset: [-1.05, 0.68, 0.15],
    anchorSide: 'left',
    icon: 'battery',
  },
  {
    id: 'CHARGING_PORT',
    title: 'Cổng sạc',
    subtitle: 'Tích hợp sạc nhanh DC & sạc thường AC',
    shortDescription: 'Cụm cổng sạc bố trí gọn trên thân xe kèm đèn báo trạng thái.',
    material: 'Tiếp điểm hợp kim đồng & nắp che kín',
    function: 'Tiếp nhận nguồn điện nạp cho bộ pin',
    highlight: 'Hỗ trợ sạc thường AC và sạc nhanh DC',
    roleSummary: 'Đảm bảo kết nối sạc an toàn, tiện lợi',
    infoFrames: buildInfoFrames(
      'Tiếp điểm hợp kim đồng & nắp che kín',
      'Tiếp nhận nguồn điện nạp cho bộ pin',
      'Hỗ trợ sạc thường AC và sạc nhanh DC',
      'Đảm bảo kết nối sạc an toàn, tiện lợi'
    ),
    position: [-0.88, 0.86, -1.42],
    calloutOffset: [-0.98, 0.56, -0.35],
    anchorSide: 'left',
    icon: 'zap',
  },
  {
    id: 'TAILLIGHTS',
    title: 'Đèn hậu',
    subtitle: 'Dải LED nhận diện phía sau',
    shortDescription: 'Cụm đèn hậu công nghệ LED giúp tăng khả năng nhận diện.',
    material: 'Thấu kính quang học & dải chip LED',
    function: 'Báo phanh, báo rẽ và định vị đuôi xe',
    highlight: 'Công nghệ LED tiết kiệm điện, sáng rõ',
    roleSummary: 'Cảnh báo và tăng nhận diện phía sau',
    infoFrames: buildInfoFrames(
      'Thấu kính quang học & dải chip LED',
      'Báo phanh, báo rẽ và định vị đuôi xe',
      'Công nghệ LED tiết kiệm điện, sáng rõ',
      'Cảnh báo và tăng nhận diện phía sau'
    ),
    position: [0.52, 0.92, -1.92],
    calloutOffset: [-0.82, 0.58, -0.55],
    anchorSide: 'left',
    icon: 'sparkles',
  },
  {
    id: 'INTERIOR_CABIN',
    title: 'Khoang lái',
    subtitle: 'Màn hình trung tâm, vô lăng & ghế ngồi',
    shortDescription: 'Không gian nội thất thông minh hướng tới trải nghiệm người lái.',
    material: 'Ghế bọc êm ái, vô lăng & màn hình cảm ứng',
    function: 'Điều khiển xe và hiển thị thông tin',
    highlight: 'Thiết kế thông minh, bố cục trực quan',
    roleSummary: 'Nâng cao tiện nghi và trải nghiệm lái',
    infoFrames: buildInfoFrames(
      'Ghế bọc êm ái, vô lăng & màn hình cảm ứng',
      'Điều khiển xe và hiển thị thông tin',
      'Thiết kế thông minh, bố cục trực quan',
      'Nâng cao tiện nghi và trải nghiệm lái'
    ),
    position: [-0.26, 1.28, -0.18],
    calloutOffset: [0.88, 0.62, 0.05],
    anchorSide: 'right',
    icon: 'compass',
  },
  {
    id: 'DOOR_FR',
    title: 'Cửa trước bên phải',
    subtitle: 'Cửa bên phụ tích hợp kính cách âm',
    shortDescription: 'Cửa trước phía bên phụ kết hợp cảm biến an toàn và cách âm cao cấp.',
    material: 'Thép dập cường lực & kính cách âm 2 lớp',
    function: 'Bảo vệ khoang hành khách và đóng mở ra vào xe',
    highlight: 'Kính hai lớp cách âm, cảm biến cảnh báo mở cửa Safe Exit Assist',
    roleSummary: 'Bảo vệ an toàn va chạm bên và giữ không gian yên tĩnh',
    infoFrames: buildInfoFrames(
      'Thép dập cường lực & kính cách âm 2 lớp',
      'Bảo vệ khoang hành khách và đóng mở ra vào xe',
      'Kính hai lớp cách âm, cảm biến cảnh báo mở cửa Safe Exit Assist',
      'Bảo vệ an toàn va chạm bên và giữ không gian yên tĩnh'
    ),
    position: [0.92, 0.86, 0.52],
    calloutOffset: [0.95, 0.55, 0.20],
    anchorSide: 'right',
    icon: 'shield',
  },
  {
    id: 'DOOR_FL',
    title: 'Cửa trước bên trái',
    subtitle: 'Cửa bên lái tích hợp kính cách âm',
    shortDescription: 'Cửa trước phía bên lái tích hợp điều khiển trung tâm và kính cách âm.',
    material: 'Thép dập cường lực & kính cách âm 2 lớp',
    function: 'Bảo vệ khoang hành khách và đóng mở ra vào xe',
    highlight: 'Cụm điều khiển gương kính điện tử, khóa an toàn',
    roleSummary: 'Bảo vệ an toàn va chạm bên và điều khiển trung tâm',
    infoFrames: buildInfoFrames(
      'Thép dập cường lực & kính cách âm 2 lớp',
      'Bảo vệ khoang hành khách và đóng mở ra vào xe',
      'Cụm điều khiển gương kính điện tử, khóa an toàn',
      'Bảo vệ an toàn va chạm bên và điều khiển trung tâm'
    ),
    position: [-0.92, 0.86, 0.52],
    calloutOffset: [-0.95, 0.55, 0.20],
    anchorSide: 'left',
    icon: 'shield',
  },
  {
    id: 'DOOR_RR',
    title: 'Cửa sau bên phải',
    subtitle: 'Cửa hành khách phía sau bên phải',
    shortDescription: 'Cửa sau bên phụ tích hợp khóa trẻ em an toàn và kính cách nhiệt.',
    material: 'Thép dập cường lực & kính cách nhiệt',
    function: 'Ra vào khoang hành khách phía sau an toàn',
    highlight: 'Khóa an toàn trẻ em điện tử và kính cách nhiệt',
    roleSummary: 'Bảo vệ hành khách phía sau khi có va chạm ngang',
    infoFrames: buildInfoFrames(
      'Thép dập cường lực & kính cách nhiệt',
      'Ra vào khoang hành khách phía sau an toàn',
      'Khóa an toàn trẻ em điện tử và kính cách nhiệt',
      'Bảo vệ hành khách phía sau khi có va chạm ngang'
    ),
    position: [0.92, 0.86, -0.42],
    calloutOffset: [0.95, 0.55, -0.20],
    anchorSide: 'right',
    icon: 'shield',
  },
  {
    id: 'DOOR_RL',
    title: 'Cửa sau bên trái',
    subtitle: 'Cửa hành khách phía sau bên trái',
    shortDescription: 'Cửa sau bên lái tích hợp khóa trẻ em an toàn và kính cách nhiệt.',
    material: 'Thép dập cường lực & kính cách nhiệt',
    function: 'Ra vào khoang hành khách phía sau an toàn',
    highlight: 'Khóa an toàn trẻ em điện tử và kính cách nhiệt',
    roleSummary: 'Bảo vệ hành khách phía sau khi có va chạm ngang',
    infoFrames: buildInfoFrames(
      'Thép dập cường lực & kính cách nhiệt',
      'Ra vào khoang hành khách phía sau an toàn',
      'Khóa an toàn trẻ em điện tử và kính cách nhiệt',
      'Bảo vệ hành khách phía sau khi có va chạm ngang'
    ),
    position: [-0.92, 0.86, -0.42],
    calloutOffset: [-0.95, 0.55, -0.20],
    anchorSide: 'left',
    icon: 'shield',
  },
  {
    id: 'WHEEL_FR',
    title: 'Bánh trước phải',
    subtitle: 'Mâm hợp kim nhôm & Lốp không săm',
    shortDescription: 'Cụm bánh xe trước bên phụ tích hợp cảm biến áp suất và phanh đĩa.',
    material: 'Mâm hợp kim nhôm & lốp không săm',
    function: 'Hỗ trợ xe vận hành và dẫn hướng ổn định',
    highlight: 'Cân bằng động tối ưu, cảm biến TPMS',
    roleSummary: 'Tăng độ bám đường và an toàn dẫn hướng',
    infoFrames: buildInfoFrames(
      'Mâm hợp kim nhôm & lốp không săm',
      'Hỗ trợ xe vận hành và dẫn hướng ổn định',
      'Cân bằng động tối ưu, cảm biến TPMS',
      'Tăng độ bám đường và an toàn dẫn hướng'
    ),
    position: [0.86, 0.36, 1.34],
    calloutOffset: [0.95, 0.58, 0.35],
    anchorSide: 'right',
    icon: 'disc',
  },
  {
    id: 'WHEEL_RL',
    title: 'Bánh sau trái',
    subtitle: 'Mâm hợp kim nhôm & Lốp không săm',
    shortDescription: 'Cụm bánh xe sau bên lái chịu tải và truyền động tối ưu.',
    material: 'Mâm hợp kim nhôm & lốp không săm',
    function: 'Truyền động cầu sau và bám đường',
    highlight: 'Lốp bản rộng chịu tải cao cho cụm pin',
    roleSummary: 'Ổn định thân xe và chống trượt khi tăng tốc',
    infoFrames: buildInfoFrames(
      'Mâm hợp kim nhôm & lốp không săm',
      'Truyền động cầu sau và bám đường',
      'Lốp bản rộng chịu tải cao cho cụm pin',
      'Ổn định thân xe và chống trượt khi tăng tốc'
    ),
    position: [-0.86, 0.36, -1.34],
    calloutOffset: [-0.95, 0.58, -0.35],
    anchorSide: 'left',
    icon: 'disc',
  },
  {
    id: 'WHEEL_RR',
    title: 'Bánh sau phải',
    subtitle: 'Mâm hợp kim nhôm & Lốp không săm',
    shortDescription: 'Cụm bánh xe sau bên phụ chịu tải và truyền động tối ưu.',
    material: 'Mâm hợp kim nhôm & lốp không săm',
    function: 'Truyền động cầu sau và bám đường',
    highlight: 'Lốp bản rộng chịu tải cao cho cụm pin',
    roleSummary: 'Ổn định thân xe và chống trượt khi tăng tốc',
    infoFrames: buildInfoFrames(
      'Mâm hợp kim nhôm & lốp không săm',
      'Truyền động cầu sau và bám đường',
      'Lốp bản rộng chịu tải cao cho cụm pin',
      'Ổn định thân xe và chống trượt khi tăng tốc'
    ),
    position: [0.86, 0.36, -1.34],
    calloutOffset: [0.95, 0.58, -0.35],
    anchorSide: 'right',
    icon: 'disc',
  },
  {
    id: 'HOOD',
    title: 'Nắp ca-pô',
    subtitle: 'Nắp ca-pô trước khí động học',
    shortDescription: 'Nắp che khoang động cơ điện và cốp trước khí động học.',
    material: 'Hợp kim nhôm siêu nhẹ',
    function: 'Bảo vệ khoang máy trước và tối ưu dòng khí',
    highlight: 'Hấp thụ xung lực va chạm bảo vệ người đi bộ',
    roleSummary: 'Giảm trọng lượng phần đầu xe và tối ưu khí động học',
    infoFrames: buildInfoFrames(
      'Hợp kim nhôm siêu nhẹ',
      'Bảo vệ khoang máy trước và tối ưu dòng khí',
      'Hấp thụ xung lực va chạm bảo vệ người đi bộ',
      'Giảm trọng lượng phần đầu xe và tối ưu khí động học'
    ),
    position: [0.0, 0.82, 1.25],
    calloutOffset: [0.0, 0.75, 0.40],
    anchorSide: 'top',
    icon: 'layers',
  },
  {
    id: 'ROOF',
    title: 'Nóc xe',
    subtitle: 'Trần kính toàn cảnh Panorama',
    shortDescription: 'Mui trần kính toàn cảnh nguyên khối cách nhiệt Low-E cao cấp.',
    material: 'Kính an toàn nhiều lớp phủ phản xạ nhiệt',
    function: 'Che chắn khoang hành khách và mở rộng không gian',
    highlight: 'Chống 99% tia UV, kết cấu chịu lực đạt chuẩn 5 sao',
    roleSummary: 'Tăng độ cứng vững cho khung xe và tối ưu ánh sáng',
    infoFrames: buildInfoFrames(
      'Kính an toàn nhiều lớp phủ phản xạ nhiệt',
      'Che chắn khoang hành khách và mở rộng không gian',
      'Chống 99% tia UV, kết cấu chịu lực đạt chuẩn 5 sao',
      'Tăng độ cứng vững cho khung xe và tối ưu ánh sáng'
    ),
    position: [0.0, 1.45, -0.30],
    calloutOffset: [0.0, 0.70, -0.20],
    anchorSide: 'top',
    icon: 'sun',
  },
  {
    id: 'DIFFUSER',
    title: 'Cản sau & Khuếch tán',
    subtitle: 'Bộ khuếch tán khí động học gầm sau',
    shortDescription: 'Cụm cản sau và khuếch tán gió tối ưu hóa lực nén và độ ổn định.',
    material: 'Nhựa kỹ thuật gia cường & cánh gió thể thao',
    function: 'Điều hướng luồng khí gầm xe và bảo vệ đuôi xe',
    highlight: 'Hệ số cản khí động học thấp, tích hợp cảm biến lùi',
    roleSummary: 'Giảm nhiễu loạn khí sau xe và tăng độ bám đuôi',
    infoFrames: buildInfoFrames(
      'Nhựa kỹ thuật gia cường & cánh gió thể thao',
      'Điều hướng luồng khí gầm xe và bảo vệ đuôi xe',
      'Hệ số cản khí động học thấp, tích hợp cảm biến lùi',
      'Giảm nhiễu loạn khí sau xe và tăng độ bám đuôi'
    ),
    position: [0.0, 0.32, -1.80],
    calloutOffset: [-0.85, 0.50, -0.40],
    anchorSide: 'left',
    icon: 'sparkles',
  },
];

/**
 * Clones a base set of hotspots and applies model-specific position, offset,
 * anchor side, and text transformations cleanly without mutating shared configurations.
 */
export function cloneHotspotsWithTransforms(
  baseHotspots: VehicleHotspotItem[] = DEFAULT_EV_HOTSPOTS,
  transforms: Partial<Record<VehiclePartId, Partial<VehicleHotspotItem>>> = {}
): VehicleHotspotItem[] {
  return (baseHotspots || DEFAULT_EV_HOTSPOTS).map((item) => {
    const custom = transforms[item.id];
    if (!custom) {
      return {
        ...item,
        position: [...item.position] as [number, number, number],
        calloutOffset: [...item.calloutOffset] as [number, number, number],
        infoFrames: item.infoFrames ? item.infoFrames.map((f) => ({ ...f })) : [],
      };
    }

    const material = custom.material ?? item.material;
    const func = custom.function ?? item.function;
    const highlight = custom.highlight ?? item.highlight;
    const roleSummary = custom.roleSummary ?? item.roleSummary ?? item.function;

    return {
      ...item,
      ...custom,
      position: custom.position
        ? ([...custom.position] as [number, number, number])
        : ([...item.position] as [number, number, number]),
      calloutOffset: custom.calloutOffset
        ? ([...custom.calloutOffset] as [number, number, number])
        : ([...item.calloutOffset] as [number, number, number]),
      anchorSide: custom.anchorSide ?? item.anchorSide,
      icon: custom.icon ?? item.icon,
      material,
      function: func,
      highlight,
      roleSummary,
      infoFrames:
        custom.infoFrames ??
        buildInfoFrames(material, func, highlight, roleSummary),
    };
  });
}

/**
 * Helper to clone default hotspots and apply model-specific overrides cleanly,
 * automatically regenerating the 4-frame sequence when text fields are customized.
 */
export function createModelHotspots(
  overrides: Partial<Record<VehiclePartId, Partial<VehicleHotspotItem>>>
): VehicleHotspotItem[] {
  return cloneHotspotsWithTransforms(DEFAULT_EV_HOTSPOTS, overrides);
}

/**
 * Extensible Per-Model 3D Hotspot Configuration Registry
 */
export const vehicleHotspots: Record<string, VehicleHotspotItem[]> = {
  'VinFast VF8 Plus': createModelHotspots({
    WHEEL_FL: {
      subtitle: 'Mâm hợp kim nhôm & Lốp không săm',
      material: 'Mâm hợp kim nhôm thể thao & lốp không săm',
      highlight: 'Thiết kế 2 tông màu, tích hợp cảm biến TPMS',
    },
    HEADLIGHTS: {
      subtitle: 'Dải LED chữ V nhận diện thương hiệu',
      highlight: 'Dải LED cánh chim đặc trưng, độ sáng cao',
    },
    BATTERY: {
      subtitle: 'Hệ thống Pin Lithium-ion đặt sàn xe',
      highlight: 'Dung lượng cao, làm mát chất lỏng chủ động',
    },
    INTERIOR_CABIN: {
      subtitle: 'Màn hình cảm ứng trung tâm & vô lăng D-cut',
      highlight: 'Không gian tối giản tích hợp điều khiển thông minh',
    },
  }),

  'Tesla Model Y Long Range': createModelHotspots({
    WHEEL_FL: {
      subtitle: 'Mâm hợp kim nhôm & Lốp không săm',
      highlight: 'Thiết kế khí động học giảm lực cản không khí',
    },
    DOOR_HANDLE: {
      subtitle: 'Tay nắm cửa phẳng ẩn vào thân xe',
      highlight: 'Thiết kế phẳng ẩn vào cửa tối ưu khí động học',
    },
    BATTERY: {
      subtitle: 'Bộ pin Lithium-ion Long Range sàn xe',
      highlight: 'Cung cấp năng lượng cho hệ dẫn động 2 mô-tơ',
    },
    INTERIOR_CABIN: {
      subtitle: 'Màn hình trung tâm 15 inch & trần kính',
      highlight: 'Tập trung điều khiển thông minh trên màn hình',
    },
  }),

  'Hyundai Mistra EV 2021': createModelHotspots({
    WHEEL_FL: {
      subtitle: 'Mâm hợp kim khí động học & Lốp không săm',
      highlight: 'Thiết kế mâm giảm cản gió, êm ái đô thị',
      position: [-0.82, 0.35, 1.34],
    },
    HEADLIGHTS: {
      subtitle: 'Cụm đèn pha LED hiện đại',
      highlight: 'Phối hợp mặt ca-lăng kín đặc trưng xe điện',
      position: [0.64, 0.70, 1.92],
    },
    BATTERY: {
      subtitle: 'Bộ pin Lithium-ion đặt dưới sàn xe',
      highlight: 'Tối ưu hiệu suất năng lượng cho dòng sedan điện',
      position: [-0.84, 0.20, -0.26],
    },
    INTERIOR_CABIN: {
      subtitle: 'Cụm màn hình kỹ thuật số & nút bấm sang số',
      highlight: 'Khoang lái sedan rộng rãi, hiển thị trực quan',
      position: [-0.24, 1.24, -0.16],
    },
  }),

  'Hyundai Kona Electric 2024': createModelHotspots({
    WHEEL_FL: {
      subtitle: 'Mâm hợp kim nhôm & Lốp không săm',
      highlight: 'Cấu trúc mâm hình học cứng vững, bám đường',
      position: [-0.84, 0.37, 1.28],
    },
    HEADLIGHTS: {
      subtitle: 'Dải đèn LED ngang đầu xe hiện đại',
      highlight: 'Dải chiếu sáng liền mạch phong cách tương lai',
      position: [0.64, 0.76, 1.80],
    },
    TAILLIGHTS: {
      subtitle: 'Đèn hậu LED đồng bộ thiết kế đầu xe',
      highlight: 'Đồ họa LED nổi bật, tăng nhận diện ban đêm',
      position: [0.54, 0.92, -1.78],
    },
    INTERIOR_CABIN: {
      subtitle: 'Màn hình kép liền mạch & khoang lái mở',
      highlight: 'Không gian SUV thoáng đãng, tiện nghi thông minh',
      position: [-0.26, 1.30, -0.16],
    },
  }),

  /**
   * Calibrated coordinates for EV02 stylized sport coupe geometry
   */
  EV02: createModelHotspots({
    WHEEL_FL: {
      position: [0.78, 0.32, 1.37],
      calloutOffset: [0.95, 0.56, 0.30],
      anchorSide: 'right',
    },
    HEADLIGHTS: {
      position: [0.60, 0.66, 2.28],
      calloutOffset: [0.75, 0.58, 0.45],
      anchorSide: 'right',
    },
    WINDSHIELD: {
      position: [0.18, 1.06, 0.55],
      calloutOffset: [0.85, 0.58, 0.20],
      anchorSide: 'top',
    },
    BODY: {
      position: [0.88, 0.72, -0.45],
      calloutOffset: [1.02, 0.52, 0.0],
      anchorSide: 'right',
    },
    SIDE_MIRROR: {
      position: [-0.90, 0.96, 0.62],
      calloutOffset: [-0.95, 0.55, 0.20],
      anchorSide: 'left',
    },
    DOOR_HANDLE: {
      position: [-0.88, 0.78, 0.08],
      calloutOffset: [-0.98, 0.48, -0.15],
      anchorSide: 'left',
    },
    BATTERY: {
      position: [-0.82, 0.18, -0.25],
      calloutOffset: [-1.02, 0.65, 0.15],
      anchorSide: 'left',
    },
    CHARGING_PORT: {
      position: [-0.86, 0.80, -1.62],
      calloutOffset: [-0.96, 0.55, -0.35],
      anchorSide: 'left',
    },
    TAILLIGHTS: {
      position: [0.48, 0.78, -2.36],
      calloutOffset: [0.82, 0.55, -0.45],
      anchorSide: 'right',
    },
    INTERIOR_CABIN: {
      position: [-0.22, 1.15, -0.12],
      calloutOffset: [-0.88, 0.58, 0.05],
      anchorSide: 'left',
    },
    DOOR_FR: {
      position: [-0.87, 0.76, 0.21],
      calloutOffset: [-0.95, 0.55, 0.20],
      anchorSide: 'left',
    },
    DOOR_FL: {
      position: [0.87, 0.76, 0.21],
      calloutOffset: [0.95, 0.55, 0.20],
      anchorSide: 'right',
    },
    DOOR_RR: {
      position: [-0.79, 0.76, -0.69],
      calloutOffset: [-0.95, 0.55, -0.20],
      anchorSide: 'left',
    },
    DOOR_RL: {
      position: [0.79, 0.76, -0.69],
      calloutOffset: [0.95, 0.55, -0.20],
      anchorSide: 'right',
    },
    WHEEL_FR: {
      position: [-0.77, 0.30, 1.37],
      calloutOffset: [-0.95, 0.58, 0.35],
      anchorSide: 'left',
    },
    WHEEL_RL: {
      position: [0.77, 0.30, -1.27],
      calloutOffset: [0.95, 0.58, -0.35],
      anchorSide: 'right',
    },
    WHEEL_RR: {
      position: [-0.77, 0.30, -1.27],
      calloutOffset: [-0.95, 0.58, -0.35],
      anchorSide: 'left',
    },
    HOOD: {
      position: [0.0, 0.82, 1.25],
      calloutOffset: [0.0, 0.75, 0.40],
      anchorSide: 'top',
    },
    ROOF: {
      position: [0.0, 1.45, -0.30],
      calloutOffset: [0.0, 0.70, -0.20],
      anchorSide: 'top',
    },
    DIFFUSER: {
      position: [0.0, 0.32, -1.80],
      calloutOffset: [-0.85, 0.50, -0.40],
      anchorSide: 'left',
    },
  }),

  'Tesla Cybertruck': cloneHotspotsWithTransforms(DEFAULT_EV_HOTSPOTS, {
    DOOR_FR: {
      position: [1.05, 0.95, 0.65],
      calloutOffset: [1.05, 0.60, 0.25],
      anchorSide: 'right',
    },
    DOOR_FL: {
      position: [-1.05, 0.95, 0.65],
      calloutOffset: [-1.05, 0.60, 0.25],
      anchorSide: 'left',
    },
    DOOR_RR: {
      position: [1.05, 0.95, -0.45],
      calloutOffset: [1.05, 0.60, -0.25],
      anchorSide: 'right',
    },
    DOOR_RL: {
      position: [-1.05, 0.95, -0.45],
      calloutOffset: [-1.05, 0.60, -0.25],
      anchorSide: 'left',
    },
    WHEEL_FR: {
      position: [1.02, 0.45, 1.70],
      calloutOffset: [1.08, 0.55, 0.35],
      anchorSide: 'right',
    },
    WHEEL_FL: {
      position: [-1.02, 0.45, 1.70],
      calloutOffset: [-1.08, 0.55, 0.35],
      anchorSide: 'left',
    },
    WHEEL_RL: {
      position: [-1.02, 0.45, -1.70],
      calloutOffset: [-1.08, 0.55, -0.35],
      anchorSide: 'left',
    },
    WHEEL_RR: {
      position: [1.02, 0.45, -1.70],
      calloutOffset: [1.08, 0.55, -0.35],
      anchorSide: 'right',
    },
    HOOD: {
      position: [0.0, 1.05, 1.55],
      calloutOffset: [0.0, 0.80, 0.40],
      anchorSide: 'top',
    },
    ROOF: {
      position: [0.0, 1.78, 0.10],
      calloutOffset: [0.0, 0.75, -0.20],
      anchorSide: 'top',
    },
    DIFFUSER: {
      position: [0.0, 0.45, -2.35],
      calloutOffset: [0.0, 0.50, -0.40],
      anchorSide: 'left',
    },
    HEADLIGHTS: {
      position: [0.0, 0.90, 2.35],
      calloutOffset: [0.0, 0.65, 0.45],
      anchorSide: 'top',
    },
    TAILLIGHTS: {
      position: [0.0, 1.05, -2.40],
      calloutOffset: [0.0, 0.65, -0.45],
      anchorSide: 'top',
    },
    WINDSHIELD: {
      position: [0.0, 1.35, 0.75],
      calloutOffset: [0.0, 0.70, 0.25],
      anchorSide: 'top',
    },
    BATTERY: {
      position: [0.0, 0.28, 0.0],
      calloutOffset: [-1.10, 0.65, 0.15],
      anchorSide: 'left',
    },
    CHARGING_PORT: {
      position: [-1.05, 0.95, -1.80],
      calloutOffset: [-1.05, 0.55, -0.35],
      anchorSide: 'left',
    },
  }),

  default: DEFAULT_EV_HOTSPOTS,
};

/**
 * Resolves the appropriate 3D hotspot list for a given vehicle and vehicleCode,
 * with automatic fallback to `vehicleHotspots.default` (Sections 9 & 10).
 */
export function resolveVehicleHotspots(
  vehicle?: VehicleResponse | null,
  vehicleCode?: 'EV01' | 'EV02' | string | null
): VehicleHotspotItem[] {
  if (vehicle) {
    const candidates = [vehicle.model, vehicle.name]
      .filter((v): v is string => Boolean(v && v.trim()))
      .map((v) => v.trim());

    for (const candidate of candidates) {
      if (vehicleHotspots[candidate]) {
        return vehicleHotspots[candidate];
      }
      const lower = candidate.toLowerCase();
      if (lower.includes('vf8') || lower.includes('vf 8')) {
        return vehicleHotspots['VinFast VF8 Plus'];
      }
      if (lower.includes('cybertruck')) {
        return vehicleHotspots['Tesla Cybertruck'];
      }
      if (lower.includes('model y') || lower.includes('tesla')) {
        return vehicleHotspots['Tesla Model Y Long Range'];
      }
      if (lower.includes('mistra')) {
        return vehicleHotspots['Hyundai Mistra EV 2021'];
      }
      if (lower.includes('kona')) {
        return vehicleHotspots['Hyundai Kona Electric 2024'];
      }
    }
  }

  if (vehicleCode === 'EV02') {
    return vehicleHotspots.EV02;
  }

  return vehicleHotspots.default;
}

/**
 * Finds a specific hotspot item by part ID for the active vehicle.
 */
export function getVehicleHotspotById(
  partId: VehiclePartId | string | null | undefined,
  vehicle?: VehicleResponse | null,
  vehicleCode?: 'EV01' | 'EV02' | string | null
): VehicleHotspotItem | null {
  if (!partId) return null;
  const list = resolveVehicleHotspots(vehicle, vehicleCode);
  return list.find((h) => h.id === partId) || null;
}
