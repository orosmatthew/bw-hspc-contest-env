#!/bin/bash
npx prisma db push --accept-data-loss
npx prisma generate
INIT=true node build