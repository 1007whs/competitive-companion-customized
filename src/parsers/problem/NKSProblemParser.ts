import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';

export class NKSProblemParser extends Parser {
    public getMatchPatterns(): string[] {
        return ['http://oi.nks.edu.cn/zh/Problem/Details*'];
    }

    public async parse(url: string, html: string): Promise<Sendable> {
        const elem = htmlToElement(html);
        const task = new TaskBuilder('NKS OJ').setUrl(url);

        // 提取基本信息
        const params = new URLSearchParams(url.split('?')[1]);
        const cid = params.get('cid');
        const tid = params.get('tid');
        const shortName = `NKS ${cid} ${tid}`;

        const titleElem = elem.querySelector('#TdMainTitle');
        const fullTitle = titleElem.textContent.trim().replace(/^[a-zA-Z]\s+/, '');
        await task.setName(fullTitle, shortName);

        task.setTimeLimit(1000);
        task.setMemoryLimit(1024);

        // 核心修复：保留空格和换行
        this.parseSamplesWithSpacesAndNewlines(elem, task);

        return task.build();
    }

    /**
     * 保留所有空格（包括HTML实体空格）和换行
     */
    private parseSamplesWithSpacesAndNewlines(elem: Element, task: TaskBuilder): void {
        // 处理样例输入
        const inputElements = Array.from(elem.querySelectorAll('[id^="SampleInput-"]'))
            .map(el => {
                const pTag = el.querySelector('p');
                if (!pTag) return { number: -1, content: '' };

                // 1. 获取<p>标签的原始HTML内容
                let content = pTag.innerHTML;

                // 2. 移除<p>和</p>标签（仅标签本身）
                content = content.replace(/<\/?p>/gi, '');

                // 3. 转换HTML空格实体为普通空格（关键修复）
                // 处理&nbsp;、&#160;等常见空格实体
                content = content.replace(/&nbsp;|&#160;/gi, ' ');

                // 4. 保留原始换行，仅去除首尾空白
                content = content.trim();

                return {
                    number: parseInt(el.id.split('-')[1], 10),
                    content
                };
            })
            .filter(item => item.number !== -1)
            .sort((a, b) => a.number - b.number);

        // 处理样例输出（同输入逻辑）
        const outputElements = Array.from(elem.querySelectorAll('[id^="SampleOutput-"]'))
            .map(el => {
                const pTag = el.querySelector('p');
                if (!pTag) return { number: -1, content: '' };

                let content = pTag.innerHTML;
                content = content.replace(/<\/?p>/gi, '');
                content = content.replace(/&nbsp;|&#160;/gi, ' ');
                content = content.trim();

                return {
                    number: parseInt(el.id.split('-')[1], 10),
                    content
                };
            })
            .filter(item => item.number !== -1)
            .sort((a, b) => a.number - b.number);

        // 配对样例
        const maxCount = Math.min(inputElements.length, outputElements.length);
        for (let i = 0; i < maxCount; i++) {
            task.addTest(inputElements[i].content, outputElements[i].content);
        }
    }
}