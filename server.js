const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const Product = require('./models/productModel');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const usersState = new Map();

function sendWithTyping(socket, content, delay = 1000) {
  socket.emit('bot-typing', true);
  setTimeout(() => {
    socket.emit('bot-typing', false);
    socket.emit('bot-reply', content);
  }, delay);
}

const deliveryPrices = {
  groupA: ['سوهاج', 'قنا', 'الأقصر', 'اسوان', 'أسوان'],
  groupB: ['اسيوط', 'أسيوط', 'بني سويف', 'المنيا'],
  groupC: ['القاهرة', 'القاهره', 'الجيزة', 'الجيزه'],
};

const deliveryCosts = {
  groupA: { cost: 100, time: 'من 5 إلى 7 أيام' },
  groupB: { cost: 70, time: '5 أيام' },
  groupC: { cost: 40, time: '3 أيام' },
  other: { cost: 60, time: '4 أيام' },
};

io.on('connection', (socket) => {
  usersState.set(socket.id, {
    step: 'greeting',
    lastProduct: null,
    awaitingConfirmation: false,
    awaitingGovernorate: false,
    pendingDeliveryInfo: false,
    timeout: null,
  });

function resetTimeout() {
  const state = usersState.get(socket.id);
  if (state.timeout) clearTimeout(state.timeout);
  state.timeout = setTimeout(() => {
    sendWithTyping(socket, 'تم إنهاء المحادثة بسبب عدم التفاعل.', 1000, () => {
      usersState.delete(socket.id);
      socket.disconnect();
    });
  }, 30 * 1000);
  usersState.set(socket.id, state);
}


  socket.on('user-message', async (msg) => {
    const state = usersState.get(socket.id);
    const message = msg.trim().toLowerCase();
    resetTimeout();

    if (['شكرا', 'شكرًا', 'thx', 'thanks', 'thank you'].includes(message)) {
      sendWithTyping(socket, 'العفو! تحت أمرك في أي وقت ');
      return;
    }

    if (state.awaitingGovernorate) {
      let costInfo = deliveryCosts.other;
      if (deliveryPrices.groupA.some(gov => gov.toLowerCase() === message)) {
        costInfo = deliveryCosts.groupA;
      } else if (deliveryPrices.groupB.some(gov => gov.toLowerCase() === message)) {
        costInfo = deliveryCosts.groupB;
      } else if (deliveryPrices.groupC.some(gov => gov.toLowerCase() === message)) {
        costInfo = deliveryCosts.groupC;
      }

      const deliveryText = state.pendingDeliveryInfo
        ? `مدة التوصيل إلى ${msg} هي ${costInfo.time}.`
        : `تكلفة التوصيل إلى ${msg} هي ${costInfo.cost} جنيه.`;

      sendWithTyping(socket, deliveryText);

      state.awaitingGovernorate = false;
      state.pendingDeliveryInfo = false;
      usersState.set(socket.id, state);

      sendWithTyping(socket, {
        text: 'هل تود السؤال عن شيء آخر؟',
        options: ['السعر', 'البرند', 'تكلفة التوصيل', 'مدة التوصيل', 'سياسة الاسترجاع والاستبدال', 'أريد البحث عن منتج جديد'],
      });
      return;
    }

    if (state.awaitingConfirmation) {
      if (['نعم', 'ايوه', 'أيوه', 'yes'].includes(message)) {
        state.step = 'waiting_for_detail';
        state.awaitingConfirmation = false;
        usersState.set(socket.id, state);

        sendWithTyping(socket, {
          text: 'تمام، حابب تسأل عن ايه بالظبط؟',
          options: ['السعر', 'البرند', 'تكلفة التوصيل', 'مدة التوصيل', 'سياسة الاسترجاع والاستبدال'],
        });
        return;
      } else if (['لا', 'لأ', 'no', 'لا شكراً'].includes(message)) {
        state.step = 'waiting_for_product';
        state.awaitingConfirmation = false;
        usersState.set(socket.id, state);

        sendWithTyping(socket, 'حسناً، من فضلك اكتب اسم المنتج الذي تبحث عنه مرة أخرى.');
        return;
      } else {
        sendWithTyping(socket, 'يرجى الرد بـ "نعم" أو "لا" فقط.');
        return;
      }
    }

    const greetings = ['مرحبا', 'السلام عليكم', 'مساء الخير', 'صباح الخير', 'hello', 'hi'];
    if (state.step === 'greeting') {
      if (greetings.some(greet => message.includes(greet))) {
        sendWithTyping(socket, 'مرحبًا! أقدر أساعد حضرتك بإيه؟ اكتب اسم المنتج اللي بتدور عليه.');
        state.step = 'waiting_for_product';
        usersState.set(socket.id, state);
      } else {
        sendWithTyping(socket, 'من فضلك ابدأ بالتحية مثل "مرحبا" أو "السلام عليكم".');
      }
      return;
    }

    if (state.step === 'waiting_for_product') {
      try {
        const products = await Product.find(
          { $text: { $search: msg } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(1)
          .populate('brand');

        if (products.length === 0) {
          sendWithTyping(socket, `عذرًا، المنتج "${msg}" غير متوفر حاليًا.`);
          return;
        }

        const product = products[0];
        state.lastProduct = product;
        state.awaitingConfirmation = true;
        usersState.set(socket.id, state);

        sendWithTyping(socket, `هل تقصد المنتج التالي؟\n"${product.name}"\nيرجى الرد بـ "نعم" أو "لا".`);
        return;
      } catch (error) {
        sendWithTyping(socket, 'حدث خطأ أثناء البحث عن المنتج. حاول مرة أخرى.');
        return;
      }
    }

    if (state.step === 'waiting_for_detail') {
      const product = state.lastProduct;
      if (!product) {
        sendWithTyping(socket, 'لم يتم تحديد المنتج. الرجاء كتابة اسم المنتج أولاً.');
        state.step = 'waiting_for_product';
        usersState.set(socket.id, state);
        return;
      }

      switch (message) {
        case 'السعر':
          sendWithTyping(socket, `السعر هو: ${product.price} جنيه.`);
          break;
        case 'البرند':
          sendWithTyping(socket, `البرند هو: ${product.brand?.name || 'غير معروف'}.`);
          break;
        case 'تكلفة التوصيل':
          sendWithTyping(socket, 'من فضلك اكتب اسم المحافظة لتحديد تكلفة التوصيل.');
          state.awaitingGovernorate = true;
          state.pendingDeliveryInfo = false;
          usersState.set(socket.id, state);
          return;
        case 'مدة التوصيل':
          sendWithTyping(socket, 'من فضلك اكتب اسم المحافظة لتحديد مدة التوصيل.');
          state.awaitingGovernorate = true;
          state.pendingDeliveryInfo = true;
          usersState.set(socket.id, state);
          return;
        case 'سياسة الاسترجاع والاستبدال':
          sendWithTyping(socket, 'يمكنك الاسترجاع أو الاستبدال خلال 14 يومًا من الاستلام بشرط أن يكون المنتج في حالته الأصلية.');
          break;
        case 'أريد البحث عن منتج جديد':
          state.step = 'waiting_for_product';
          state.lastProduct = null;
          usersState.set(socket.id, state);
          sendWithTyping(socket, 'من فضلك اكتب اسم المنتج الذي تبحث عنه.');
          return;
        default:
          sendWithTyping(socket, 'عذراً، يمكنك السؤال عن: السعر، البرند، تكلفة التوصيل، مدة التوصيل، أو سياسة الاسترجاع والاستبدال.');
          return;
      }

      sendWithTyping(socket, {
        text: 'هل تود السؤال عن شيء آخر؟',
        options: ['السعر', 'البرند', 'تكلفة التوصيل', 'مدة التوصيل', 'سياسة الاسترجاع والاستبدال', 'أريد البحث عن منتج جديد'],
      });
    }
  });

  socket.on('disconnect', () => {
    usersState.delete(socket.id);
  });
});

mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log('DB connected successfully'))
  .catch(err => console.log('DB connection failed', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
