import Image from 'next/image';
import Card from '../ui/Card';
import { add, cog, flash, list, menuSharp, searchSharp } from 'ionicons/icons';

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonMenuButton,
  IonList,
  IonReorderGroup,
  IonItem,
  IonLabel,
  IonReorder,
  ItemReorderEventDetail,
  IonTabBar,
  IonTabButton,
  IonFab,
  IonFabButton,
} from '@ionic/react';
import Notifications from './Notifications';
import { useState } from 'react';
import { notificationsOutline, filterSharp } from 'ionicons/icons';
import { selectHomeItems } from '../../store/selectors';
import Store from '../../store';

type FeedCardProps = {
  title: string;
  type: string;
  text: string;
  author: string;
  authorAvatar: string;
  image: string;
};

const FeedCard = ({
  title,
  type,
  text,
  author,
  authorAvatar,
  image,
}: FeedCardProps) => (
  <Card className="my-4 mx-auto">
    <div className="h-32 w-full relative">
      <Image
        className="rounded-t-xl object-cover min-w-full min-h-full max-w-full max-h-full"
        src={image}
        alt=""
        fill
      />
    </div>
    <div className="px-4 py-4 bg-white rounded-b-xl dark:bg-gray-900">
      <h4 className="font-bold py-0 text-s text-gray-400 dark:text-gray-500 uppercase">
        {type}
      </h4>
      <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-100">
        {title}
      </h2>
      <p className="sm:text-sm text-s text-gray-500 mr-1 my-3 dark:text-gray-400">
        {text}
      </p>
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 relative">
          <Image
            src={authorAvatar}
            className="rounded-full object-cover min-w-full min-h-full max-w-full max-h-full"
            alt=""
            fill
          />
        </div>
        <h3 className="text-gray-500 dark:text-gray-200 m-l-8 text-sm font-medium">
          {author}
        </h3>
      </div>
    </div>
  </Card>
);

const Feed = () => {
  const homeItems = Store.useState(selectHomeItems);
  const [showNotifications, setShowNotifications] = useState(false);

  function handleReorder(event: CustomEvent<ItemReorderEventDetail>) {
    // The `from` and `to` properties contain the index of the item
    // when the drag started and ended, respectively
    console.log('Dragged from index', event.detail.from, 'to', event.detail.to);

    // Finish the reorder and position the item in the DOM based on
    // where the gesture ended. This method can also be called directly
    // by the reorder group
    event.detail.complete();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Starfocus</IonTitle>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowNotifications(true)}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          {/* The reorder gesture is disabled by default, enable it to drag and drop items */}
          <IonReorderGroup disabled={false} onIonItemReorder={handleReorder}>
            <IonItem>
              <IonLabel>Item 1</IonLabel>
              <IonReorder slot="end"></IonReorder>
            </IonItem>

            <IonItem>
              <IonLabel>Item 2</IonLabel>
              <IonReorder slot="end"></IonReorder>
            </IonItem>

            <IonItem>
              <IonLabel>Item 3</IonLabel>
              <IonReorder slot="end"></IonReorder>
            </IonItem>

            <IonItem>
              <IonLabel>Item 4</IonLabel>
              <IonReorder slot="end"></IonReorder>
            </IonItem>

            <IonItem>
              <IonLabel>Item 5</IonLabel>
              <IonReorder slot="end"></IonReorder>
            </IonItem>
          </IonReorderGroup>
        </IonList>
        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton>
            <IonIcon icon={add}></IonIcon>
          </IonFabButton>
        </IonFab>
      </IonContent>
      <IonTabBar slot="bottom">
        <IonTabButton tab="tab1" href="/feed">
          <IonIcon icon={filterSharp} />
          <IonLabel>Filter</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab2" href="/lists">
          <IonIcon icon={searchSharp} />
          <IonLabel>Search</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab3" href="/settings">
          <IonIcon icon={menuSharp} />
          <IonLabel>More</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonPage>
  );
};

export default Feed;
