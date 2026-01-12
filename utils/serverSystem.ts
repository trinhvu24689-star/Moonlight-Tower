
import { ServerInfo } from '../types';

// Danh sách tên server phong cách tiên hiệp (Dùng cho sau này)
const SERVER_NAMES = [
    "Tử Lưu Ly", "Đông Hoàng", "Thái Cực", "Vô Cực", "Hỗn Độn", 
    "Bàn Cổ", "Hiên Viên", "Thần Nông", "Phục Hy", "Nữ Oa"
];

const getRandomPing = (region: string, status: string) => {
    let base = 0;
    let variance = 0;

    // Ping cơ bản theo khu vực (giả lập người chơi ở VN)
    switch(region) {
        case 'VietNam': base = 15; variance = 15; break; // Ping ngon nhất
        case 'Asia': base = 45; variance = 30; break;
        case 'HK/TW': base = 60; variance = 40; break;
        case 'China': base = 90; variance = 60; break;
        default: base = 100; variance = 50;
    }

    // Ping tăng nếu server đông/bảo trì
    if (status === 'Busy') base += 20;
    if (status === 'Full') base += 50;
    if (status === 'Maintenance') return 999;

    return Math.floor(base + Math.random() * variance);
};

export const generateServerList = (): ServerInfo[] => {
    // --- DEVELOPMENT MODE ---
    // Chỉ tạo cố định 4 server cho 4 khu vực
    
    const devServers: ServerInfo[] = [
        {
            id: 's_vn',
            region: 'VietNam',
            name: 'VietNam-1 • Đông Hoàng',
            label: 'Đông Hoàng',
            status: 'Good',
            isNew: true, // Server VN đang hot
            ping: getRandomPing('VietNam', 'Good')
        },
        {
            id: 's_asia',
            region: 'Asia',
            name: 'Asia-1 • Tử Lưu Ly',
            label: 'Tử Lưu Ly',
            status: 'Busy', // Server Asia đông người chơi cũ
            isNew: false,
            ping: getRandomPing('Asia', 'Busy')
        },
        {
            id: 's_hktw',
            region: 'HK/TW',
            name: 'HK/TW-1 • Thái Cực',
            label: 'Thái Cực',
            status: 'Good',
            isNew: false,
            ping: getRandomPing('HK/TW', 'Good')
        },
        {
            id: 's_cn',
            region: 'China',
            name: 'China-1 • Vô Cực',
            label: 'Vô Cực',
            status: 'Maintenance', // Giả lập bảo trì khu vực TQ
            isNew: false,
            ping: getRandomPing('China', 'Maintenance')
        }
    ];

    return devServers;
};

export const getServerById = (id: string) => {
    const list = generateServerList();
    return list.find(s => s.id === id) || list[0];
};
