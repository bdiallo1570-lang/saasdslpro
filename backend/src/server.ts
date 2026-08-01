import { app } from '@/app';
import { env } from '@/config/env';

app.listen(env.PORT, () => {
  console.log(`DSL Air-Cargo API démarrée sur http://localhost:${env.PORT}`);
});
