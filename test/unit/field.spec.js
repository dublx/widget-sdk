import Field, {UnknownLocaleError} from '../../lib/api/field'
import {
  noop,
  describeAttachHandlerMember
} from '../helpers'

describe(`Field`, () => {
  let channelStub
  beforeEach(() => {
    channelStub = {
      addHandler: sinon.stub(),
      call: sinon.stub()
    }
  })

  describe(`construction error`, () => {
    it(`gets thrown if defaultLocale is not included in info.locales`, () => {
      expect(() => {
        new Field(channelStub, {id: 'x', locales: ['de-DE'], values: {}}, 'en-US')
      }).to.throw((new UnknownLocaleError('x', 'en-US')).message)
    })
  })

  describe(`instance`, () => {
    const defaultLocale = 'en-US'
    const localeWithoutValue = 'locale-without-value'
    const unknownLocale = 'some-unknown-locale'
    const info = {
      id: 'some-field',
      locales: ['en-US', 'it-IT', 'de-DE', localeWithoutValue],
      values: {
        'en-US': 'Hello',
        'it-IT': 'Ciao',
        'de-DE': 'Hallo'
      }
    }
    let field
    beforeEach(() => {
      const infoCopy = JSON.parse(JSON.stringify(info))
      field = new Field(channelStub, infoCopy, defaultLocale)
    })

    it(`is a Field instance`, () => {
      expect(field).to.be.instanceof(Field)
    })

    describe(`.id`, () => {
      it(`is equal to info.id`, () => {
        expect(field.id).to.equal(info.id)
      })
    })

    describe(`.locales`, () => {
      it(`is set to the same value as info.locales`, () => {
        expect(field.locales).to.deep.equal(info.locales)
      })
    })

    describe(`.getValue()`, () => {
      it(`returns the default locale's value`, () => {
        expect(field.getValue()).to.equal(info.values[defaultLocale])
      })
    })

    describe(`.getValue(locale)`, () => {
      describe(`with locale set to the default locale "${defaultLocale}"`, () => {
        it(`returns the value for the given locale`, () => {
          expect(field.getValue(defaultLocale)).to.equal(info.values[defaultLocale])
        })
      })

      describe(`for locale set to a locale without value`, () => {
        it(`should return undefined`, () => {
          expect(field.getValue(localeWithoutValue)).to.equal(undefined)
        })
      })

      describe(`for locale set to a unknown locale`, () => {
        it(`should return undefined`, () => {
          expect(field.getValue('unknown-locale')).to.equal(undefined)
        })
      })

      info.locales.forEach((locale) => {
        if (locale === defaultLocale) {
          return
        }
        describe(`with locale set to "${locale}"`, () => {
          it(`returns the value for the given locale`, () => {
            expect(field.getValue(locale)).to.equal(info.values[locale])
          })
        })
      })
    })

    describeSetValue(`.setValue(value)`, undefined, defaultLocale)

    describe(`.setValue(value, locale)`, () => {
      info.locales.forEach((locale) => {
        describeSetValue(`with locale set to "${locale}"`, locale, locale)
      })

      it(`throws an error if locale is unknown to the field`, () => {
        expect(() => {
          field.setValue('value', unknownLocale)
        }).to.throw((new UnknownLocaleError(field.id, unknownLocale)).message)
      })
    })

    function describeSetValue (msg, locale, localeOrDefault) {
      describe(msg, () => {
        const newValue = `new-value-${localeOrDefault}`

        beforeEach(() => {
          field.setValue(newValue, locale)
        })

        it(`changes the locale's value`, () => {
          expect(field.getValue(locale)).to.equal(newValue)
        })
        it(`invokes channel.call("setValue", ...)`, () => {
          expect(channelStub.call).to.have.been.calledWithExactly(
            'setValue', field.id, localeOrDefault, newValue)
        })
        it(`returns the promise returned by internal channel.call()`, () => {
          channelStub.call.withArgs('setValue').returns('PROMISE')
          expect(field.setValue('val')).to.equal('PROMISE')
        })
      })
    }

    describeRemoveValue(`.removeValue()`, undefined)

    describe(`.removeValue(locale)`, () => {
      info.locales.forEach((locale) => {
        describeRemoveValue(`with locale set to "${locale}"`, locale)
      })
    })

    function describeRemoveValue (msg, locale) {
      describe(msg, () => {
        const localeParam = locale ? `"${locale}"` : 'undefined'

        it(`is just a call to .setValue(undefined, ${localeParam})`, () => {
          const setValueSpy = sinon.spy(field, 'setValue')
          field.removeValue(locale)

          expect(setValueSpy)
            .to.have.callCount(1).and
            .to.have.been.calledWithExactly(undefined, locale)
        })
        it(`returns the same value as .setValue(undefined, ${localeParam})`, () => {
          let setValueStub = sinon.stub(field, 'setValue')
          setValueStub.returns('PROMISE')
          expect(field.removeValue()).to.equal('PROMISE')
        })
        it(`makes .getValue(${localeParam}) return undefined`, () => {
          field.removeValue(locale)
          expect(field.getValue(locale)).to.equal(undefined)
        })
      })
    }

    describeAttachHandlerMember(`.onValueChanged(handler)`, () => {
      return field.onValueChanged(noop)
    })

    describe(`.onValueChanged(locale, handler)`, () => {
      info.locales.forEach((locale) => {
        describeAttachHandlerMember(`with locale set to ${locale}`, () => {
          return field.onValueChanged(locale, noop)
        })
      })

      it(`throws an error if locale is unknown to the field`, () => {
        expect(() => {
          field.onValueChanged(unknownLocale, noop)
        }).to.throw((new UnknownLocaleError(field.id, unknownLocale)).message)
      })
    })

    describe(`injected channel propagating "valueChanged"`, () => {
      const newValue = 'some new, unused value'

      let valueChangedHandlers
      beforeEach(() => {
        valueChangedHandlers = (...handlerArgs) => {
          channelStub.addHandler.args.forEach((args) => {
            // Handler registered with channel.addHandler("valueChanged", handler)
            args[1](...handlerArgs)
          })
        }
      })

      describe(`targeted at another field's id`, () => {
        it(`does not update the value`, () => {
          const oldValue = field.getValue()
          valueChangedHandlers(`${field.id}-other-id`, defaultLocale, newValue)

          expect(oldValue).to.equal(field.getValue())
        })
      })
      describe(`targeted at the field's id`, () => {
        describe(`for specific locale`, () => {
          it(`sets the locale's value to the given one`, () => {
            valueChangedHandlers(field.id, defaultLocale, newValue)

            expect(field.getValue()).to.equal(newValue)
          })
        })
        describe(`without locale provided`, () => {
          it(`sets all locales' values to the given one`, () => {
            valueChangedHandlers(field.id, undefined, newValue)

            info.locales.forEach((locale) => {
              expect(field.getValue(locale)).to.equal(newValue)
            })
          })
        })
      })
    })
  })
})