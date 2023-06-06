import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';

export class DimikOJProblemParser extends Parser {
  public getMatchPatterns(): string[] {
    return ['https://dimikoj.com/problems/*/*'];
  }

  public async parse(url: string, html: string): Promise<Sendable> {
    const doc = htmlToElement(html);
    const task = new TaskBuilder('DimikOJ').setUrl(url);

    const headerText = doc.querySelector('.card-header').textContent;
    const problemTitle = headerText.split('—').at(-1).trim();
    task.setName(problemTitle);

    // no time limit is given at any problem
    // 1s time limit and 512MB memory limit assumed
    task.setTimeLimit(1000);
    task.setMemoryLimit(512);

    const submissionDiv = doc.querySelector('#submission');
    const codeBlocks = [...submissionDiv.previousElementSibling.querySelectorAll('code')];

    for (let i = 0; i < codeBlocks.length; i += 2) {
      task.addTest(codeBlocks[i].textContent, codeBlocks[i + 1].textContent);
    }

    return task.build();
  }
}
