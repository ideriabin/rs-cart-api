import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';

import { pg } from '../../shared/pg';
import { Cart } from '../models';

@Injectable()
export class CartService {

  async findByUserId(userId: string): Promise<Cart> {
    const { rows: [{ id: cartId }] } = await pg.query({
      text: 'SELECT id FROM carts WHERE user_id=$1',
      values: [userId],
    });
    const { rows: items } = await pg.query({
      text: 'SELECT * FROM cart_items WHERE cart_id=$1',
      values: [cartId],
    });
    return { id: cartId, items };
  }

  async createByUserId(userId: string) {
    const id = v4(v4());
    const userCart = {
      id,
      items: [],
    };

    await pg.query({
      text: 'INSERT INTO carts (id, user_id, created_at, updated_at, status) VALUES ($1, $2, NOW(), NOW(), "OPEN")',
      values: [id, userId],
    });

    return userCart;
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    const { id, ...rest } = await this.findOrCreateByUserId(userId);

    const updatedCart = {
      id,
      ...rest,
      items: [ ...items ],
    } as any

    await pg.query({
      text: 'UPDATE carts SET created_at=$1, updated_at=$2, status=$3 WHERE user_id=$4',
      values: [updatedCart.created_at, updatedCart.updated_at, updatedCart.status, userId],
    });

    await pg.query({
      text: 'DELETE FROM cart_items WHERE cart_id=$1',
      values: [id],
    });



    for (const item of updatedCart.items) {
      await pg.query({
        text: 'INSERT INTO cart_items (cart_id, product_id, count) VALUES ($1, $2, $3)',
        values: [id, item.product_id, item.count],
      });
    }

    return { ...updatedCart };
  }

  async removeByUserId(userId): Promise<void> {
    await pg.query({ text: 'DELETE FROM cart WHERE user_id=$1', values: [userId] });
  }

}
