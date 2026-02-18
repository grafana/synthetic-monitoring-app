import { setupWorker } from 'msw/browser';
import { HANDLERS } from 'test/handlers';

setupWorker(...HANDLERS).start();
