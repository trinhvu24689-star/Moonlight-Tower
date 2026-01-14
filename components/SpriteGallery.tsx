import React from 'react';

export const SpriteGallery: React.FC = () => {
  // Tạo một danh sách số từ 1 đến 191
  const spriteIds = Array.from({ length: 191 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          📜 DANH SÁCH SPRITE (1 - 191)
          <br />
          <span className="text-sm font-normal text-slate-400">
            (Nếu thấy ảnh ở đây tức là file public đã chuẩn)
          </span>
        </h1>

        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4">
          {spriteIds.map((id) => (
            <div 
              key={id} 
              className="flex flex-col items-center bg-slate-800 p-2 rounded-lg border border-slate-700 hover:border-yellow-500 transition-colors"
            >
              {/* Số thứ tự */}
              <span className="text-[10px] text-slate-400 mb-1">#{id}</span>
              
              {/* ẢNH SPRITE */}
              <div className="w-12 h-12 flex items-center justify-center bg-slate-700/50 rounded p-1">
                <img
                  src={`/Class_Monster_${id}.png`} // QUAN TRỌNG: Phải có dấu / ở đầu
                  alt={`Sprite ${id}`}
                  className="w-full h-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    // Nếu lỗi ảnh thì hiện chữ X đỏ
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-red-500 text-xs">Lỗi</span>';
                  }}
                />
              </div>
              
              {/* Tên file */}
              <span className="text-[8px] text-slate-500 mt-1 truncate w-full text-center">
                Class_Monster_{id}
              </span>
            </div>
          ))}
        </div>
        
        {/* Nút tắt tạm thời (nếu vk muốn copy vào App để test xong xóa) */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          Kéo xuống dưới cùng để xem hết danh sách
        </div>
      </div>
    </div>
  );
};