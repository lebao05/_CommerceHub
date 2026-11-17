export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  /** Short summary shown on the card */
  excerpt: string;
  /** Full article paragraphs, used on the news listing page */
  body: string[];
  category: string;
  /** ISO date, kept for sorting */
  date: string;
  /** Date rendered for display, e.g. 12/11/2026 */
  displayDate: string;
  /** Estimated reading time in minutes */
  readTime: number;
  image: string;
  /** Where the card links to */
  href: string;
  /** The article shown as the large card at the top of the section */
  featured?: boolean;
}

/**
 * Editorial content for the "Tin tức" block on the home page.
 * Vietnamese copy only — the block is intentionally not translated.
 */
export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    slug: 'air-max-pulse-ra-mat',
    title: 'Nike Air Max Pulse: bước ngoặt mới của dòng Air Max',
    excerpt:
      'Lớp đệm lạnh và lưới kỹ thuật mới giúp mỗi bước chân nhẹ hơn, êm hơn trong cả ngày dài.',
    body: [
      'Air Max Pulse chính thức ra mắt tại thị trường Việt Nam với năm phiên bản màu sắc, bắt đầu từ bộ đôi màu trắng "Triple White" quen thuộc.',
      'Điểm nổi bật của mẫu giày nằm ở lớp đệm lạnh Air mới: bơm khí chủ động khi bạn bước, giúp bề mặt luôn có độ đàn hồi tốt thay vì cảm giác chùng sau thời gian dài.',
      'Phần upper sử dụng lưới kỹ thuật có khả năng thông gió, kết hợp đường khâu tách lớp ở phần thân giúp chân khô thoáng ngay cả khi vận động cường độ cao.',
      'Bộ sản phẩm hiện có sẵn trên CommerceHub với nhiều kích cỡ, miễn phí vận chuyển cho đơn hàng từ ₫2.500.000.',
    ],
    category: 'Ra mắt sản phẩm',
    date: '2026-11-11',
    displayDate: '11/11/2026',
    readTime: 3,
    image:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1000&q=80',
    href: '/products',
    featured: true,
  },
  {
    id: 'news-2',
    slug: 'chon-giay-chay-cho-nguoi-moi',
    title: 'Cách chọn giày chạy đúng cho người mới bắt đầu',
    excerpt:
      'Không phải mẫu giày đắt nhất cũng phù hợp. Bốn tiêu chí này sẽ giúp bạn chọn đôi giày chạy đầu tiên hợp lý.',
    body: [
      'Bước đầu tiên khi chọn giày chạy là xác định mục đích sử dụng: chạy bộ trên đường phố, chạy trên máy tập hay chạy đường trail địa hình thường xuyên.',
      'Tiếp theo, hãy đo chiều dài bàn chân khi đứng và chọn giày rộng hơn khoảng 1cm ở phần ngón chân rộng nhất. Một đôi giày ôm sát chân sẽ nhanh chóng gây phồng rộp.',
      'Trọng lượng giày cũng là yếu tố quan trọng: giày nhẹ hơn giúp bước chân nhanh và thoải mái hơn trong các buổi tập dài.',
      'Cuối cùng, hãy thử đi trong giày tại cửa hàng trước khi mua. Một đôi giày đúng sẽ không tạo cảm giác chật ngay từ lần đầu.',
    ],
    category: 'Hướng dẫn',
    date: '2026-11-08',
    displayDate: '08/11/2026',
    readTime: 5,
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    href: '/products',
  },
  {
    id: 'news-3',
    slug: 'jordan-1-low-chat-lieu-tai-che',
    title: 'Jordan 1 Low phiên bản mùa đông với chất liệu tái chế',
    excerpt:
      '20% chất liệu tái chế, gam màu trắng ngà và đường khâu tương phản điểm nhấn cho mùa lạnh.',
    body: [
      'Jordan 1 Low mùa đông sử dụng hơn 20% chất liệu tái chế trên phần upper, đồng thời giữ lại bề mặt da tổng hợp mềm mại quen thuộc.',
      'Gam màu trắng ngà kết hợp với chi tiết đen ở lưỡi gà và logo Jumpman giúp mẫu giày dễ phối cùng cả quần jeans lẫn đồ thể thao.',
      'Đế cao su kẻ sọc được gia cố thêm ở phần trước bàn chân, tăng độ bám trên mặt đường ẩm trong mùa mưa.',
    ],
    category: 'Thời trang',
    date: '2026-11-05',
    displayDate: '05/11/2026',
    readTime: 4,
    image:
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    href: '/products',
  },
  {
    id: 'news-4',
    slug: 'flash-sale-cuoi-tuan',
    title: 'Flash Sale cuối tuần: giảm đến 40% cho sneaker Nike',
    excerpt:
      'Chỉ 48 giờ, số lượng có hạn cho hàng loạt mẫu Nike và Jordan trong chương trình Flash Sale.',
    body: [
      'Flash Sale cuối tuần kéo dài từ 00:00 thứ Sáu đến 23:59 Chủ Nhật, với mức giảm lên đến 40% cho nhiều mẫu sneaker Nike và Jordan.',
      'Số lượng mỗi mẫu được giới hạn theo từng cỡ, do đó hãy hoàn tất thanh toán sớm để tránh hết hàng.',
      'Đơn hàng Flash Sale vẫn được áp dụng chính sách đổi trả trong 7 ngày và miễn phí vận chuyển cho đơn từ ₫2.500.000.',
    ],
    category: 'Khuyến mãi',
    date: '2026-11-01',
    displayDate: '01/11/2026',
    readTime: 2,
    image:
      'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=800&q=80',
    href: '/products',
  },
  {
    id: 'news-5',
    slug: 'bao-quan-giay-mua-mua',
    title: 'Bảo quản giày đúng cách trong mùa mưa',
    excerpt:
      'Từ vỏ bảo vệ chống nước đến cách làm khô nhanh, giúp đôi giày của bạn bền hơn nhiều mùa.',
    body: [
      'Bước đầu tiên là không để giày ướt sồi trong túi. Hãy chèn giấy báo và bỏ hút ẩm trước khi cất giày vào tủ.',
      'Vệ sinh bằng khăn ẩm và xà phòng nhạt, tránh ngâm trong nước vì sẽ làm mất chất keo và làm lỗi da.',
      'Sau khi giặt, phơi ở nơi thoáng gió nhưng tránh ánh nắng trực tiếp, vệ sinh lưới ở bên trong giày để giữ mùi thoáng mát.',
    ],
    category: 'Hướng dẫn',
    date: '2026-10-28',
    displayDate: '28/10/2026',
    readTime: 6,
    image:
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
    href: '/products',
  },
];

/** The article rendered as the large card at the top of the news section. */
export const FEATURED_NEWS: NewsArticle | undefined = NEWS_ARTICLES.find(
  article => article.featured,
);

/** The remaining articles, shown as the compact list next to the featured one. */
export const SECONDARY_NEWS: NewsArticle[] = NEWS_ARTICLES.filter(
  article => !article.featured,
);
