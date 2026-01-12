import React from 'react';
import { Scroll, X, Skull, UtensilsCrossed, Sword } from 'lucide-react';

interface StoryPanelProps {
  onClose: () => void;
}

export const StoryPanel: React.FC<StoryPanelProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-amber-50 rounded-lg shadow-2xl overflow-hidden border-4 border-stone-800 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 text-amber-500 p-4 flex justify-between items-center border-b-4 border-amber-900">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Scroll className="text-amber-500" />
            Biên Niên Sử Tiệc Nướng
          </h2>
          <button onClick={onClose} className="hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto font-serif text-stone-900 leading-relaxed space-y-6 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
          
          <section>
            <h3 className="text-xl font-bold border-b-2 border-stone-400 mb-2 flex items-center gap-2">
              <UtensilsCrossed size={20} /> Mở Đầu
            </h3>
            <p>
              Dưới bóng của <strong>Dãy Núi Cấm</strong>, có một ngã tư bị nguyền rủa bởi cổ nhân. 
              Truyền thuyết kể rằng bất cứ ai nướng thịt ở đó sẽ đánh thức <strong>Cơn Đói Vĩnh Cửu</strong>.
            </p>
            <p className="mt-2">
              Bạn là <strong>Đầu Bếp Ghoulish</strong>, một Chiêu Hồn Sư đã nghỉ hưu vì nhận ra việc hồi sinh người chết thật nhàm chán, 
              nhưng nướng ra miếng bít tết hoàn hảo mới là chân ái. Bạn đã dựng <em>Lò Nướng Địa Ngục</em> ngay trên long mạch bị nguyền rủa này.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b-2 border-stone-400 mb-2 flex items-center gap-2">
              <Sword size={20} /> Xung Đột
            </h3>
            <p>
              Mùi hương quyến rũ từ món BBQ huyền thoại của bạn đã thu hút hai thế lực:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>
                <strong>Hội Chiến Binh (Khách Hàng):</strong> Những chiến binh lang thang từ phương Bắc. Họ đang đói ngấu nghiến, túi đầy vàng và kiên quyết không chiến đấu khi bụng rỗng. Họ sẽ xếp hàng trật tự để chờ món sườn của bạn.
              </li>
              <li>
                <strong>Quân Đoàn Bí Ngô (Kẻ Thù):</strong> Mùi thịt nướng đã xúc phạm <strong>Vua Bí Ngô</strong>, một linh hồn ăn chay cổ đại đang ngủ yên gần đó. Hắn đã đánh thức tay sai để phá hủy lò nướng và chấm dứt bữa tiệc mãi mãi.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b-2 border-stone-400 mb-2 flex items-center gap-2">
              <Skull size={20} /> Nhiệm Vụ
            </h3>
            <p>
              Cho Hội Chiến Binh ăn để kiếm Vàng. Dùng Vàng để nâng cấp Lò Nướng (nướng nhanh hơn) và Tháp Phép Thuật (để bắn bọn bí ngô thành phân bón). 
              <br/><br/>
              <strong>Bảo vệ lò nướng. Phục vụ thịt. Sống sót qua đêm.</strong>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-stone-800 p-4 text-center text-stone-400 text-sm border-t-4 border-amber-900">
          "Nguyên liệu bí mật là... chắc không phải người đâu." - Đầu Bếp Ghoulish
        </div>
      </div>
    </div>
  );
};