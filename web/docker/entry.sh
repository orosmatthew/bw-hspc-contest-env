#!/bin/bash
# THIS FILE MUST USE LF LINE SEPARATORS!
npx prisma db push --accept-data-loss
npx prisma generate
BODY_SIZE_LIMIT=Infinity INIT=true node build