// src/app/status/route.js

import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

AWS.config.update({ region: 'us-east-2' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = 'UserImage';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const image_id = searchParams.get('image_id');

  if (!image_id) {
    return NextResponse.json({ error: 'Missing image_id' }, { status: 400 });
  }

  try {
    const data = await dynamoDB
      .get({
        TableName: tableName,
        Key: { image_id }
      })
      .promise();

    if (!data.Item) {
      return NextResponse.json({ status: 'pending' });
    }

    return NextResponse.json({
      status: data.Item.status,
      result: data.Item.inference_result || null,
      error: data.Item.error_message || null, // ✅ ADD THIS LINE
    });
  } catch (error) {
    console.error('DynamoDB error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
