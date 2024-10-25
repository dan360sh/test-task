/* Check the comments first */

import { EventEmitter } from "./emitter";
import { EventDelayedRepository, EventRepositoryError } from "./event-repository";
import { EventStatistics } from "./event-statistics";
import { ResultsTester } from "./results-tester";
import { triggerRandomly } from "./utils";

const MAX_EVENTS = 1000;

enum EventName {
  EventA = "A",
  EventB = "B",
}

const EVENT_NAMES = [EventName.EventA, EventName.EventB];

/*

  An initial configuration for this case

*/

function init() {
  const emitter = new EventEmitter<EventName>();

  triggerRandomly(() => emitter.emit(EventName.EventA), MAX_EVENTS);
  triggerRandomly(() => emitter.emit(EventName.EventB), MAX_EVENTS);

  const repository = new EventRepository();
  const handler = new EventHandler(emitter, repository);

  const resultsTester = new ResultsTester({
    eventNames: EVENT_NAMES,
    emitter,
    handler,
    repository,
  });
  resultsTester.showStats(20);
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */

/*

  The implementation of EventHandler and EventRepository is up to you.
  Main idea is to subscribe to EventEmitter, save it in local stats
  along with syncing with EventRepository.

*/
class EventHandler extends EventStatistics<EventName> {
  // Feel free to edit this class

  repository: EventRepository;
  private emitter: EventEmitter<EventName>;
  constructor(emitter: EventEmitter<EventName>, repository: EventRepository) {
    super();
    this.repository = repository;
    this.emitter = emitter;
    this.subscribeEmitter(EventName.EventB);
    this.subscribeEmitter(EventName.EventA);
  }

  private subscribeEmitter(event: EventName) {
    this.emitter.subscribe(event, () => {
      let count = this.getStats(event) + 1;
      this.setStats(event, count);
      this.repository.saveEventData(event, count);
      }
    );
  }

}

class EventRepository extends EventDelayedRepository<EventName> {
  // Feel free to edit this class

  private pause: boolean = false;
  private async setPause() {
    this.pause = true;
    await new Promise(resolve => setTimeout(resolve, 300));
    this.pause = false;
  }


  async saveEventData(eventName: EventName, count: number) {
    if(this.pause) {
      return;
    }

    try {
      const countAdd = count - this.getStats(eventName);
      if(countAdd > 0) {
        await this.updateEventStatsBy(eventName, countAdd);
      }

    } catch (e) {
      const error = e as EventRepositoryError;
      if(error === EventRepositoryError.TOO_MANY && !this.pause) {
        this.setPause();
      }
    }
  }
}

init();
