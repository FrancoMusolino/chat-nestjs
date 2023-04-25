import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Novu,
  ISubscriberPayload,
  ITriggerPayloadOptions,
  ITopicPayload,
  ITopicSubscribersPayload,
} from '@novu/node';

import { NotificationTypes } from './notificationTypes.enum';

@Injectable()
export class NotificationService {
  novu: Novu;

  constructor(private readonly configService: ConfigService) {
    this.novu = new Novu(this.configService.get('NOVU_API_KEY'));
  }

  async addSubscriber(subscriberId: string, data?: ISubscriberPayload) {
    await this.novu.subscribers.identify(subscriberId, data);
  }

  async removeSubscriber(subscriberId: string) {
    await this.novu.subscribers.delete(subscriberId);
  }

  async notificationTrigger(
    triggerId: NotificationTypes,
    opts: ITriggerPayloadOptions,
  ) {
    try {
      await this.novu.trigger(triggerId, opts);
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async createTopic(payload: ITopicPayload, topicCreatorId: string) {
    const { data } = await this.novu.topics.create(payload);

    await this.addSubscriberToTopic(data.data.key, {
      subscribers: [topicCreatorId],
    });
  }

  async addSubscriberToTopic(topicKey: string, data: ITopicSubscribersPayload) {
    await this.novu.topics.addSubscribers(topicKey, data);
  }

  async removeSubscribersFromTopic(
    topicKey: string,
    data: ITopicSubscribersPayload,
  ) {
    await this.novu.topics.removeSubscribers(topicKey, data);
  }
}
