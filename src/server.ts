import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;
console.log('🔍 [DEBUG] PORT:', PORT, 'from env:', process.env.PORT);

console.log('🔍 [DEBUG] Tentando iniciar servidor na porta', PORT);

let server: any;
try {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log('✅ Servidor iniciado com sucesso!');
    console.log('📋 Endpoints disponíveis:');
    console.log('  GET /health');
    console.log('  POST /api/auth/register');
    console.log('  POST /api/auth/login');
    console.log('  GET /api/labels');
    console.log('  GET /api/lgpd/privacy-policy');
  });
  console.log('✅ [DEBUG] app.listen() chamado com sucesso');
} catch (error: any) {
  console.error('❌ [ERROR] Erro ao chamar app.listen():', error.message);
  console.error('❌ [ERROR] Stack:', error.stack);
  process.exit(1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
